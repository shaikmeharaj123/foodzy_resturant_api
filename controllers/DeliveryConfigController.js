const DeliveryPartnerConfig = require("../models/DeliveryPartnerConfigModel");
const PartnerLedger = require("../models/PartnerLedgerModel");
const Order = require("../models/OrderModel");
const DeliveryPersion = require("../models/DeliveryPersionModel");
const User = require("../models/UserModel");
const admin = require("firebase-admin");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const {
  getActiveDeliveryConfig,
  calculateDeliveryPartnerEarning,
  lockAndCreditPartnerSettlement,
  calculateHaversineDistanceKm,
} = require("../utils/deliveryPartnerEarnings");

/**
 * Get active delivery partner earnings configuration
 */
exports.getDeliveryConfig = catchAsyncErrors(async (req, res, next) => {
  const config = await getActiveDeliveryConfig();
  return res.status(200).json({
    success: true,
    config,
  });
});

/**
 * Update delivery partner earnings configuration (Admin)
 */
exports.updateDeliveryConfig = catchAsyncErrors(async (req, res, next) => {
  const updateData = { ...req.body, updatedAt: new Date() };

  let config = await DeliveryPartnerConfig.findOneAndUpdate(
    { configKey: "GLOBAL_DEFAULT" },
    updateData,
    { new: true, upsert: true, runValidators: true }
  );

  return res.status(200).json({
    success: true,
    message: "Delivery partner configuration updated successfully",
    config,
  });
});

/**
 * Preview partner earnings calculation for a given order or parameters
 */
exports.previewPartnerEarnings = catchAsyncErrors(async (req, res, next) => {
  const {
    restaurantLatitude,
    restaurantLongitude,
    userLatitude,
    userLongitude,
    distanceKm: explicitDistance,
    rainMode,
    extraDemandPay,
    incentiveAmount,
    deliveryTip,
    cancellationScenario,
    orderId,
  } = req.body;

  const config = await getActiveDeliveryConfig();

  let orderPayload = {
    restauntLatitude: restaurantLatitude,
    restauntLongitude: restaurantLongitude,
    userAddress: {
      Latitude: userLatitude,
      Longitude: userLongitude,
    },
    distance: explicitDistance,
    delivery_tip: deliveryTip || 0,
  };

  if (orderId) {
    const existingOrder = await Order.findById(orderId);
    if (existingOrder) {
      orderPayload = existingOrder;
    }
  }

  const breakdown = calculateDeliveryPartnerEarning(orderPayload, config, {
    rainMode: rainMode === true,
    extraDemandPay,
    incentiveAmount,
    cancellationScenario,
  });

  return res.status(200).json({
    success: true,
    breakdown,
  });
});

/**
 * Get partner ledger history
 */
exports.getPartnerLedger = catchAsyncErrors(async (req, res, next) => {
  const partnerId = req.params.partnerId;

  const ledger = await PartnerLedger.find({
    deliveryPartnerId: partnerId,
  }).sort({ createdAt: -1 });

  const totalEarned = ledger
    .filter((entry) => entry.status === "CREDITED")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return res.status(200).json({
    success: true,
    totalEarned,
    count: ledger.length,
    ledger,
  });
});

/**
 * Admin Settlement Dashboard Summary
 * Displays: Order ID, Delivery Partner, Distance, Base Pay, Distance Pay, Peak Pay, Rain Pay, Demand Pay, Incentive, Tip, Total Earning, Settlement Status, Platform Subsidy
 */
exports.getAdminSettlementsSummary = catchAsyncErrors(async (req, res, next) => {
  const { startDate, endDate, status } = req.query;

  const filter = {};
  if (status) {
    filter["deliverySettlement.settlementStatus"] = status;
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(filter)
    .select(
      "_id Username restauntName DeliveryPersionId DeliveryPersionName delivery_Charge delivery_tip platform_fee grand_total status order_status deliverySettlement createdAt"
    )
    .sort({ createdAt: -1 })
    .limit(100);

  const summary = orders.map((order) => {
    const settlement = order.deliverySettlement || {};
    const customerDeliveryCharge = Number(order.delivery_Charge || 0);
    const partnerEarnings = Number(settlement.totalPartnerEarning || 0);
    // Platform subsidy: if customer delivery charge < partner earnings
    const platformSubsidy = Math.max(0, partnerEarnings - customerDeliveryCharge);

    return {
      orderId: order._id,
      customerName: order.Username,
      restaurantName: order.restauntName,
      deliveryPartnerId: order.DeliveryPersionId || "Unassigned",
      deliveryPartnerName: order.DeliveryPersionName || "Unassigned",
      orderStatus: order.status,
      customerDeliveryCharge,
      customerTip: Number(order.delivery_tip || settlement.deliveryTip || 0),
      platformFee: Number(order.platform_fee || 0),
      platformSubsidy,
      deliverySettlement: {
        distanceKm: settlement.distanceKm || 0,
        basePay: settlement.basePay || 0,
        distancePay: settlement.distancePay || 0,
        peakPay: settlement.peakPay || 0,
        rainPay: settlement.rainPay || 0,
        demandPay: settlement.demandPay || 0,
        incentiveAmount: settlement.incentiveAmount || 0,
        deliveryTip: settlement.deliveryTip || 0,
        totalPartnerEarning: partnerEarnings,
        settlementStatus: settlement.settlementStatus || "PENDING",
        calculatedAt: settlement.calculatedAt,
        lockedAt: settlement.lockedAt,
      },
      createdAt: order.createdAt,
    };
  });

  return res.status(200).json({
    success: true,
    totalOrders: orders.length,
    summary,
  });
});

/**
 * Get settlement summary grouped by Delivery Partner (Rider)
 * Used in Admin Panel to see dynamically computed amount to be paid for each rider
 */
exports.getDeliveryPartnersSettlements = catchAsyncErrors(async (req, res, next) => {
  const DeliveryPersion = require("../models/DeliveryPersionModel");
  const Order = require("../models/OrderModel");
  
  const partners = await DeliveryPersion.find().lean();
  
  // Find all delivered orders that have a delivery partner assigned
  const deliveredOrders = await Order.find({
    order_status: 5,
    DeliveryPersionId: { $exists: true, $ne: null },
  })
    .select("_id DeliveryPersionId deliverySettlement grand_total delivery_Charge delivery_tip createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const partnerSettlements = partners.map((partner) => {
    const partnerOrders = deliveredOrders.filter(
      (o) => String(o.DeliveryPersionId) === String(partner._id)
    );

    let totalEarned = 0;
    let totalPaid = 0;
    let pendingAmount = 0;

    partnerOrders.forEach((o) => {
      const earning = Number(o.deliverySettlement?.totalPartnerEarning || 0);
      totalEarned += earning;
      if (o.deliverySettlement?.settlementStatus === "PAID") {
        totalPaid += earning;
      } else {
        pendingAmount += earning;
      }
    });

    return {
      id: partner._id,
      name: partner.name || "Delivery Partner",
      mobile: partner.mobile || "",
      email: partner.email || "",
      city: partner.city || "",
      vehicleNumber: partner.vehicleNumber || "",
      profileImage: partner.profileImage || partner.logo || "",
      bankName: partner.bankName || "",
      accountNumber: partner.accountNumber || "",
      ifscCode: partner.ifscCode || "",
      upiId: partner.upiId || "",
      totalCompletedOrders: partnerOrders.length,
      totalEarned: Math.round(totalEarned),
      totalPaid: Math.round(totalPaid),
      pendingAmount: Math.round(pendingAmount),
      settlementStatus: pendingAmount > 0 ? "PENDING" : "SETTLED",
      lastOrderDate: partnerOrders.length > 0 ? partnerOrders[0].createdAt : null,
    };
  });

  const summaryStats = {
    totalPartners: partners.length,
    totalPendingPayout: partnerSettlements.reduce((sum, p) => sum + p.pendingAmount, 0),
    totalPaidPayout: partnerSettlements.reduce((sum, p) => sum + p.totalPaid, 0),
    totalDeliveries: deliveredOrders.length,
  };

  return res.status(200).json({
    success: true,
    summaryStats,
    partners: partnerSettlements,
  });
});

/**
 * Admin Settle / Disburse Payout to Delivery Partner
 */
exports.settlePartnerPayout = catchAsyncErrors(async (req, res, next) => {
  const { partnerId, amount, transactionRef, notes, paymentMethod } = req.body;
  const Order = require("../models/OrderModel");
  const PartnerLedger = require("../models/PartnerLedgerModel");

  if (!partnerId) {
    return res.status(400).json({ success: false, message: "Partner ID is required" });
  }

  // Find all ELIGIBLE or PENDING delivered orders for this partner
  const orders = await Order.find({
    DeliveryPersionId: partnerId,
    order_status: 5,
    "deliverySettlement.settlementStatus": { $ne: "PAID" },
  });

  let settledOrdersCount = 0;
  let totalSettled = 0;

  for (const order of orders) {
    if (!order.deliverySettlement) {
      order.deliverySettlement = {
        totalPartnerEarning: 25,
        settlementStatus: "PAID",
      };
    }
    order.deliverySettlement.settlementStatus = "PAID";
    order.deliverySettlement.settledAt = new Date();
    order.deliverySettlement.settlementRef =
      transactionRef || `PO-${Date.now().toString().slice(-8)}`;
    await order.save();

    totalSettled += Number(order.deliverySettlement.totalPartnerEarning || 0);
    settledOrdersCount += 1;
  }

  const payoutAmount = amount ? Number(amount) : totalSettled;

  // Create payout disbursement ledger entry
  let ledgerEntry = null;
  try {
    ledgerEntry = await PartnerLedger.create({
      deliveryPartnerId: partnerId,
      orderId: orders[0]?._id || partnerId,
      type: "ADJUSTMENT",
      amount: -payoutAmount,
      status: "CREDITED",
      remarks: `Disbursed ₹${payoutAmount} via ${paymentMethod || "Bank/UPI"}. Ref: ${transactionRef || "Admin Payout"}. ${notes || ""}`.trim(),
    });
  } catch (err) {
    console.error("Ledger creation error on payout:", err);
  }

  return res.status(200).json({
    success: true,
    message: `Successfully settled ₹${payoutAmount} for ${settledOrdersCount} orders`,
    settledOrdersCount,
    payoutAmount,
    ledger: ledgerEntry,
  });
});

/**
 * Rider initiates a real withdrawal request from Rider App
 */
exports.requestPartnerWithdrawal = catchAsyncErrors(async (req, res, next) => {
  const { partnerId, amount, method, upiId, bankName, accountNumber, ifscCode } = req.body;
  const PartnerLedger = require("../models/PartnerLedgerModel");
  const DeliveryPersion = require("../models/DeliveryPersionModel");

  if (!partnerId || !amount || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid partnerId and amount required",
    });
  }

  // Update bank details on rider profile if provided
  const partnerUpdate = {};
  if (upiId) partnerUpdate.upiId = upiId;
  if (bankName) partnerUpdate.bankName = bankName;
  if (accountNumber) partnerUpdate.accountNumber = accountNumber;
  if (ifscCode) partnerUpdate.ifscCode = ifscCode;
  if (Object.keys(partnerUpdate).length > 0) {
    await DeliveryPersion.findByIdAndUpdate(partnerId, partnerUpdate);
  }

  const ref = `${method === "upi" ? "UPI" : "IMPS"}/${Date.now().toString().slice(-8)}/SETTLE`;
  const ledgerEntry = await PartnerLedger.create({
    deliveryPartnerId: partnerId,
    orderId: partnerId,
    type: "ADJUSTMENT",
    amount: -Number(amount),
    status: "PENDING",
    remarks: `Withdrawal request for ₹${amount} via ${method?.toUpperCase() || "UPI"} (${ref})`,
  });

  return res.status(200).json({
    success: true,
    message: "Withdrawal request submitted successfully",
    transaction: {
      id: `PO-${ledgerEntry._id.toString().slice(-6).toUpperCase()}`,
      referenceId: ref,
      amount: Number(amount),
      method: method === "upi" ? "UPI" : "BANK",
      status: "PENDING",
      createdAt: ledgerEntry.createdAt,
    },
  });
});


/**
 * Get settlement summary grouped by Restaurant (Shop)
 * Used in Admin Panel to see dynamically computed amount to be paid for each restaurant
 */
exports.getRestaurantsSettlements = catchAsyncErrors(async (req, res, next) => {
  const Restaurant = require("../models/RestaurantModel");
  const Order = require("../models/OrderModel");

  const restaurants = await Restaurant.find().lean();

  const deliveredOrders = await Order.find({
    order_status: 5,
    restauntId: { $exists: true, $ne: null },
  })
    .select("_id restauntId restaurantSettlement grand_total total_Amount restaurent_total_Amount delivery_Charge platform_fee delivery_tip createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const restaurantSettlements = restaurants.map((rest) => {
    const restOrders = deliveredOrders.filter(
      (o) => String(o.restauntId) === String(rest._id)
    );

    let totalSales = 0;
    let totalCommission = 0;
    let totalEarned = 0;
    let totalPaid = 0;
    let pendingAmount = 0;

    const commissionRate = Number(rest.delivery_Commission) || 15;

    restOrders.forEach((o) => {
      const foodSubtotal =
        Number(o.restaurantSettlement?.foodSubtotal) ||
        Number(o.total_Amount) ||
        Number(o.restaurent_total_Amount) ||
        Math.max(
          0,
          Number(o.grand_total || 0) -
            Number(o.delivery_Charge || 0) -
            Number(o.platform_fee || 0) -
            Number(o.delivery_tip || 0)
        );

      const commAmount =
        Number(o.restaurantSettlement?.commissionAmount) ||
        Math.round(foodSubtotal * (commissionRate / 100));

      const netPayout =
        Number(o.restaurantSettlement?.netPayout) ||
        Math.max(0, foodSubtotal - commAmount);

      totalSales += foodSubtotal;
      totalCommission += commAmount;
      totalEarned += netPayout;

      if (o.restaurantSettlement?.settlementStatus === "PAID") {
        totalPaid += netPayout;
      } else {
        pendingAmount += netPayout;
      }
    });

    return {
      id: rest._id,
      name: rest.name || "Restaurant",
      mobile: rest.mobile ? String(rest.mobile) : "",
      phone: rest.contact_number || (rest.mobile ? String(rest.mobile) : ""),
      email: rest.email || "",
      address: rest.address || rest.Branch || "",
      logo: rest.logo || "",
      commissionRate,
      bankName: rest.bankName || "",
      accountNumber: rest.accountNumber || "",
      ifscCode: rest.ifscCode || "",
      upiId: rest.upiId || "",
      totalOrders: restOrders.length,
      deliveredOrders: restOrders.length,
      totalSales: Math.round(totalSales),
      totalCommission: Math.round(totalCommission),
      totalEarned: Math.round(totalEarned),
      totalPaid: Math.round(totalPaid),
      pendingAmount: Math.round(pendingAmount),
      settlementStatus: pendingAmount > 0 ? "Pending Payout" : "Settled",
      lastSettlement: restOrders.length > 0 ? restOrders[0].createdAt : null,
    };
  });

  const summaryStats = {
    totalRestaurants: restaurants.length,
    totalPendingPayout: restaurantSettlements.reduce((sum, r) => sum + r.pendingAmount, 0),
    totalPaidPayout: restaurantSettlements.reduce((sum, r) => sum + r.totalPaid, 0),
    totalSales: restaurantSettlements.reduce((sum, r) => sum + r.totalSales, 0),
    totalCommission: restaurantSettlements.reduce((sum, r) => sum + r.totalCommission, 0),
    deliveredOrders: deliveredOrders.length,
  };

  return res.status(200).json({
    success: true,
    summaryStats,
    restaurants: restaurantSettlements,
  });
});

/**
 * Admin Settle / Disburse Payout to Restaurant (Shop)
 */
exports.settleRestaurantPayout = catchAsyncErrors(async (req, res, next) => {
  const { restaurantId, amount, transactionRef, notes, paymentMethod } = req.body;
  const Order = require("../models/OrderModel");
  const Restaurant = require("../models/RestaurantModel");

  if (!restaurantId) {
    return res.status(400).json({ success: false, message: "Restaurant ID is required" });
  }

  // Find all delivered orders for this restaurant not yet settled
  const orders = await Order.find({
    restauntId: restaurantId,
    order_status: 5,
    "restaurantSettlement.settlementStatus": { $ne: "PAID" },
  });

  let settledOrdersCount = 0;
  let totalSettled = 0;

  for (const order of orders) {
    if (!order.restaurantSettlement) {
      const foodSubtotal =
        Number(order.total_Amount) ||
        Number(order.restaurent_total_Amount) ||
        Number(order.grand_total || 0);
      const commissionAmount = Math.round(foodSubtotal * 0.15);
      const netPayout = Math.max(0, foodSubtotal - commissionAmount);
      order.restaurantSettlement = {
        foodSubtotal,
        commissionRate: 15,
        commissionAmount,
        netPayout,
        settlementStatus: "PAID",
      };
    }
    order.restaurantSettlement.settlementStatus = "PAID";
    order.restaurantSettlement.settledAt = new Date();
    order.restaurantSettlement.settlementRef =
      transactionRef || `RST-${Date.now().toString().slice(-8)}`;
    await order.save();

    totalSettled += Number(order.restaurantSettlement.netPayout || 0);
    settledOrdersCount += 1;
  }

  const payoutAmount = amount ? Number(amount) : totalSettled;

  return res.status(200).json({
    success: true,
    message: `Successfully settled ₹${payoutAmount} for ${settledOrdersCount} restaurant orders`,
    settledOrdersCount,
    payoutAmount,
  });
});

exports.notifyRiderOrBroadcast = catchAsyncErrors(async (req, res, next) => {
  const {
    riderId,
    userId,
    customerId,
    title,
    message,
    type = "admin_alert",
    orderId,
    targetAudience,
    targetRoute,
  } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: "Notification title and message are required",
    });
  }

  const targetCustomer = userId || customerId;
  const audience =
    targetAudience ||
    (targetCustomer
      ? "customer_single"
      : riderId && riderId !== "ALL"
      ? "rider_single"
      : riderId === "ALL"
      ? "riders_all"
      : "all");

  const notificationPayload = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    title: String(title).trim(),
    message: String(message).trim(),
    body: String(message).trim(),
    type,
    category: type === "warning" || type === "urgent" ? "system" : "offers",
    orderId: orderId || null,
    route: targetRoute || (audience.startsWith("customer") ? "OffersScreen" : "HomeScreen"),
    targetAudience: audience,
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    read: false,
  };

  const io = req.app?.get("io");

  // ========================================================
  // 1. TARGET: ALL CUSTOMERS (Customers Only)
  // ========================================================
  if (audience === "customers_all") {
    if (io) {
      io.to("all_customers").emit("customer:notification", notificationPayload);
      console.log(`[Notification Engine] Dispatched ONLY to ALL CUSTOMERS: "${title}"`);
    }

    try {
      const customersWithTokens = await User.find({
        $or: [
          { fcmToken: { $exists: true, $ne: "" } },
          { token: { $exists: true, $ne: "" } },
        ],
      }).select("fcmToken token name");

      const tokens = customersWithTokens
        .map(u => u.fcmToken || u.token)
        .filter(t => t && t.length > 20 && !t.startsWith("fcm_mobile_"));

      if (tokens.length > 0 && admin?.apps?.length) {
        admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title: notificationPayload.title, body: notificationPayload.message },
          data: { route: notificationPayload.route, type: notificationPayload.type },
        }).catch(e => console.log("[FCM Customer Multicast Warning]", e.message));
      }
    } catch (e) {
      console.log("[FCM Customer Lookup Note]", e.message);
    }

    return res.status(200).json({
      success: true,
      message: "Notification sent to all customers successfully",
      target: "CUSTOMERS_ALL",
      notification: notificationPayload,
    });
  }

  // ========================================================
  // 2. TARGET: SINGLE CUSTOMER (Specific Customer Only)
  // ========================================================
  if (audience === "customer_single" || (targetCustomer && !riderId)) {
    if (io && targetCustomer) {
      io.to(`user_${targetCustomer}`).emit("customer:notification", notificationPayload);
      console.log(`[Notification Engine] Dispatched ONLY to Customer user_${targetCustomer}: "${title}"`);
    }

    if (targetCustomer) {
      try {
        const user = await User.findById(targetCustomer);
        const token = user?.fcmToken || user?.token;
        if (token && admin?.apps?.length && !token.startsWith("fcm_mobile_")) {
          admin.messaging().send({
            token,
            notification: { title: notificationPayload.title, body: notificationPayload.message },
            data: { route: notificationPayload.route, type: notificationPayload.type },
          }).catch(e => console.log("[FCM Single Customer Warning]", e.message));
        }
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      message: "Notification sent to customer successfully",
      target: targetCustomer,
      notification: notificationPayload,
    });
  }

  // ========================================================
  // 3. TARGET: ALL RIDERS (Riders Only)
  // ========================================================
  if (audience === "riders_all") {
    if (io) {
      io.to("all_riders").emit("rider:custom_notification", notificationPayload);
      console.log(`[Notification Engine] Dispatched ONLY to ALL RIDERS: "${title}"`);
    }

    try {
      const ridersWithTokens = await DeliveryPersion.find({
        fcmToken: { $exists: true, $ne: "" },
      }).select("fcmToken name");

      const tokens = ridersWithTokens
        .map(r => r.fcmToken)
        .filter(t => t && t.length > 20 && !t.startsWith("fcm_mobile_"));

      if (tokens.length > 0 && admin?.apps?.length) {
        admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title: notificationPayload.title, body: notificationPayload.message },
          data: { route: notificationPayload.route, type: notificationPayload.type },
        }).catch(e => console.log("[FCM Rider Multicast Warning]", e.message));
      }
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: "Notification sent to all delivery riders successfully",
      target: "RIDERS_ALL",
      notification: notificationPayload,
    });
  }

  // ========================================================
  // 4. TARGET: SINGLE RIDER (Specific Rider Only)
  // ========================================================
  if (audience === "rider_single" || (riderId && riderId !== "ALL")) {
    if (io && riderId) {
      io.to(`rider_${riderId}`).emit("rider:custom_notification", notificationPayload);
      console.log(`[Notification Engine] Dispatched ONLY to Rider rider_${riderId}: "${title}"`);
    }

    if (riderId) {
      try {
        const partner = await DeliveryPersion.findById(riderId);
        if (partner?.fcmToken && admin?.apps?.length && !partner.fcmToken.startsWith("fcm_mobile_")) {
          admin.messaging().send({
            token: partner.fcmToken,
            notification: { title: notificationPayload.title, body: notificationPayload.message },
            data: { route: notificationPayload.route, type: notificationPayload.type },
          }).catch(e => console.log("[FCM Single Rider Warning]", e.message));
        }
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      message: "Notification sent to rider successfully",
      target: riderId,
      notification: notificationPayload,
    });
  }

  // ========================================================
  // 5. TARGET: ALL (Both Customers and Riders)
  // ========================================================
  if (io) {
    io.to("all_customers").emit("customer:notification", notificationPayload);
    io.to("all_riders").emit("rider:custom_notification", notificationPayload);
    io.emit("admin:broadcast", notificationPayload);
    console.log(`[Notification Engine] Dispatched to BOTH Customers & Riders: "${title}"`);
  }

  return res.status(200).json({
    success: true,
    message: "Broadcast notification sent to all customers and riders",
    target: "ALL",
    notification: notificationPayload,
  });
});

exports.updateRiderFcmToken = catchAsyncErrors(async (req, res, next) => {
  const { partnerId, fcmToken } = req.body;
  if (!partnerId || !fcmToken) {
    return res.status(400).json({
      success: false,
      message: "partnerId and fcmToken are required",
    });
  }

  const partner = await DeliveryPersion.findByIdAndUpdate(
    partnerId,
    { fcmToken },
    { new: true }
  );

  return res.status(200).json({
    success: true,
    message: "Rider FCM token updated successfully",
    partnerId: partner?._id,
  });
});
