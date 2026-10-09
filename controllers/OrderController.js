const Order = require("../models/OrderModel");
const Restaurant = require("../models/RestaurantModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const PartnerSchedul = require("../models/partnerScheduleModel");
const OrderRequiest = require("../models/orderRequiestModel");
const moment = require("moment");
const {
  getActiveDeliveryConfig,
  calculateDeliveryPartnerEarning,
  lockAndCreditPartnerSettlement,
  lockAndCreditRestaurantSettlement,
  calculateHaversineDistanceKm,
} = require("../utils/deliveryPartnerEarnings");
const {
  sendRiderFcmNotification,
  sendMultipleRidersFcmNotification,
  sendCustomerFcmNotification,
} = require("../utils/fcmNotificationHelper");

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  const Razorpay = require("razorpay");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getOrderPaymentAmount = order => {
  const candidates = [
    order?.grand_total,
    order?.total_net_payable,
    order?.total_Amount,
    order?.totalPrice,
    order?.amount,
  ];
  const amount = candidates.map(Number).find(value => Number.isFinite(value) && value > 0);
  return amount || 0;
};

const getValidPhoneNumber = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    const digits = String(value).replace(/\D/g, "");
    const phoneNumber = Number(digits);
    if (digits && Number.isSafeInteger(phoneNumber) && phoneNumber > 0) {
      return phoneNumber;
    }
  }

  return undefined;
};

exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    const orderPayload = { ...req.body };
    if (orderPayload.status) {
      orderPayload.status = String(orderPayload.status).trim();
    }

    // Set _id, orderNumber matching _id, and generate OTP
    const generatedOrderId = orderPayload._id || new mongoose.Types.ObjectId();
    orderPayload._id = generatedOrderId;
    orderPayload.orderNumber = String(generatedOrderId);
    if (!orderPayload.otp) {
      orderPayload.otp = String(Math.floor(1000 + Math.random() * 9000));
    }

    const restId = orderPayload.restauntId || orderPayload.restaurantId;
    if (restId) {
      try {
        const restaurant = await Restaurant.findById(restId);
        if (restaurant) {
          if (restaurant.Latitude && restaurant.Longitude) {
            orderPayload.restauntLatitude = String(restaurant.Latitude);
            orderPayload.restauntLongitude = String(restaurant.Longitude);
          }
          if (restaurant.address) {
            orderPayload.restauntAddress = restaurant.address;
          }
          if (restaurant.name) {
            orderPayload.restauntName = restaurant.name;
          }
          const restaurantPhone = getValidPhoneNumber(
            restaurant.contact_number,
            restaurant.mobile,
          );
          if (restaurantPhone !== undefined) {
            orderPayload.restauntmobile = restaurantPhone;
          }
        }
      } catch (_) {}
    }

    const requestPhone = getValidPhoneNumber(orderPayload.restauntmobile);
    if (requestPhone !== undefined) {
      orderPayload.restauntmobile = requestPhone;
    } else {
      // Let the schema default apply instead of attempting to cast NaN or text.
      delete orderPayload.restauntmobile;
    }

    // Set payment_status based on payment_mode or payload
    const initialPaymentMode = String(orderPayload.payment_mode || "COD").toUpperCase();
    const passedPaymentStatus = orderPayload.payment_status || orderPayload.paymentStatus;
    delete orderPayload.paymentStatus;
    if (passedPaymentStatus) {
      orderPayload.payment_status = String(passedPaymentStatus);
    } else if (initialPaymentMode === "WALLET" || initialPaymentMode === "ONLINE") {
      orderPayload.payment_status = "Paid";
    } else {
      orderPayload.payment_status = "Unpaid";
    }

    // Calculate delivery partner earnings preview and travel time based on speed in km/h
    try {
      const config = await getActiveDeliveryConfig();
      const settlement = calculateDeliveryPartnerEarning(orderPayload, config);
      orderPayload.deliverySettlement = {
        ...settlement,
        settlementStatus: "PENDING",
      };
      if (settlement.distanceKm > 0) {
        orderPayload.distance = `${settlement.distanceKm} km`;
        // Urban speed calculation (30 km/h average)
        const speedKmPerHour = 30;
        const timeInHours = settlement.distanceKm / speedKmPerHour;
        const timeInMinutes = Math.max(5, Math.ceil(timeInHours * 60));
        orderPayload.time_takes =
          timeInMinutes >= 60
            ? `${Math.floor(timeInMinutes / 60)} hr ${timeInMinutes % 60} mins`
            : `${timeInMinutes} mins`;
      }
    } catch (calcErr) {
      console.error("Initial settlement calculation preview error:", calcErr.message);
    }

    const order = await Order.create(orderPayload);

    // For delivery orders, attempt to notify nearby delivery partners
    if (
      order.order_mode === "Delivery" &&
      order.restauntLatitude &&
      order.restauntLongitude
    ) {
      try {
        const partnerShedule = await PartnerSchedul.find({
          $and: [
            { WorkingStatus: true },
            {
              selectedDates:
                req.body.selectedDates ||
                new Date().toISOString().split("T")[0],
            },
            {
              "WorkingHours.start_hours": {
                $gte: Number(1),
              },
            },
            {
              "WorkingHours.end_hours": {
                $lte: Number(23),
              },
            },
          ],
        });

        const myLat = order.restauntLatitude;
        const myLng = order.restauntLongitude;

        const MAX_ASSIGNMENT_RADIUS_KM = 5.0;

        const filteredPartner = partnerShedule
          .filter((partner) => partner.Latitude && partner.Longitude)
          .map((partner) => {
            const distance = calculateHaversineDistanceKm(
              myLat,
              myLng,
              partner.Latitude,
              partner.Longitude,
            );

            const timeInHours = distance / 40;
            const timeInMinutes = timeInHours * 60;
            const time = Math.ceil(timeInMinutes) || 15;
            let kmbyamount = 0;
            if (Number(distance.toFixed(2)) >= 5) {
              kmbyamount = Math.round(time * 8);
            } else {
              kmbyamount = Math.round(time * 6);
            }

            return {
              ...partner.toObject(),
              distanceVal: Number(distance),
              distance: distance.toFixed(2),
              time: time,
              deliveryamount: kmbyamount,
            };
          })
          .filter((partner) => partner.distanceVal <= MAX_ASSIGNMENT_RADIUS_KM);

        if (filteredPartner.length > 0) {
          const partnerEarningAmount =
            order.deliverySettlement?.totalPartnerEarning ||
            Number(order.delivery_Charge || 0);

          for (let index = 0; index < filteredPartner.length; index++) {
            let element = filteredPartner[index];
            let formData = {
              OrderId: order._id,
              partnerId: element.partnerId,
              delivery_partnerCharge: partnerEarningAmount,
              surgeAmount: order.deliverySettlement?.demandPay || 0,
              Username: order.Username || "Customer",
              userLatitude: order.userAddress?.Latitude || "17.4483",
              userLongitude: order.userAddress?.Longitude || "78.3915",
              restauntName: order.restauntName || "Restaurant",
              restauntLatitude: order.restauntLatitude,
              restauntLongitude: order.restauntLongitude,
              distance: order.distance || "2.5 km",
              time: order.time_takes || "25 mins",
            };
            await OrderRequiest.create(formData);
            try {
              const io = req.app?.get("io");
              if (io) {
                if (element.partnerId) {
                  io.to(`rider_${element.partnerId}`).emit("order:assigned", {
                    order,
                    orderId: order._id,
                    partnerId: element.partnerId,
                    amount: partnerEarningAmount,
                  });
                }
                io.to("all_riders").emit("order:assigned", {
                  order,
                  orderId: order._id,
                  partnerId: element.partnerId,
                  amount: partnerEarningAmount,
                });
              }
            } catch (_) {}

            // Send FCM Push Notification to Rider (delivers even when rider app is CLOSED / KILLED)
            if (element.partnerId) {
              const orderNum = order.orderNumber || `#${String(order._id).slice(-6).toUpperCase()}`;
              const restName = order.restauntName || order.restaurantName || "Restaurant";
              sendRiderFcmNotification(element.partnerId, {
                title: "New Delivery Order Available! 🛵",
                body: `Order ${orderNum} from ${restName} - Earn ₹${partnerEarningAmount}. Tap to view and accept.`,
                data: {
                  orderId: String(order._id),
                  type: "order_assigned",
                  statusKey: "order_assigned",
                  route: "CustomerAcceptence",
                  partnerId: String(element.partnerId),
                  amount: String(partnerEarningAmount),
                },
              }).catch(() => {});
            }
          }
        }
      } catch (partnerErr) {
        console.error(
          "Partner assignment non-blocking error:",
          partnerErr.message,
        );
      }
    }

    // Send FCM Push Notification to Customer (delivers even when customer app is CLOSED / KILLED)
    if (order.userId) {
      const orderNum = order.orderNumber || `#${String(order._id).slice(-6).toUpperCase()}`;
      sendCustomerFcmNotification(order.userId, {
        title: "Order Placed Successfully! 🎉",
        body: `Your order ${orderNum} has been received and sent to the restaurant.`,
        data: {
          orderId: String(order._id),
          order_status: String(order.order_status || "1"),
          status: String(order.status || "Placed"),
          type: "order_status_update",
          category: "orders",
          statusKey: "placed",
          route: "TrackOrderScreen",
        },
      }).catch(() => {});
    }

    try {
      const io = req.app?.get("io");
      if (io) {
        io.to("admin_room").emit("admin:new_order", { order });
      }
    } catch (_) {}

    return res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || error._message || "Failed to create order",
      error: error,
    });
  }
});
exports.getOrderbyUserId = catchAsyncErrors(async (req, res, next) => {
  try {
    const order = await Order.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});
exports.getOrder_update_all = catchAsyncErrors(async (req, res, next) => {
  try {
    const order = await Order.find();

    for (let index = 0; index < order.length; index++) {
      let element = order[index];

      const form_data = {
        rating: 0,
      };

      element = await Order.findByIdAndUpdate(element._id, form_data, {
        new: true,
        useFindAndModify: false,
        runValidators: true,
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});
exports.getSingleOrderbyId = catchAsyncErrors(async (req, res, next) => {
  try {
    const rawId = req.params.orderId;
    const mongoose = require("mongoose");
    let order = null;
    if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
      order = await Order.findById(rawId);
    }
    if (!order && rawId) {
      order = await Order.findOne({
        $or: [
          { orderNumber: String(rawId) },
          { _id: mongoose.Types.ObjectId.isValid(rawId) ? rawId : null },
        ],
      });
    }
    if (!order) {
      order = await Order.findOne().sort({ createdAt: -1 });
    }
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});
exports.getOrderbyRestaurantId = catchAsyncErrors(async (req, res, next) => {
  try {
    const order = await Order.find({ restauntId: req.params.restauntId }).sort({
      createdAt: -1,
    });
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});
exports.getlatestOrderbypartner = catchAsyncErrors(async (req, res, next) => {
  try {
    const order = await Order.findOne({
      $and: [
        { DeliveryPersionId: req.params.partnerID },
        { order_status: { $gte: 3, $lt: 5 } },
      ],
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(200).json({
        success: false,
        massage: "Order not Found",
        order: "",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});
exports.getOrderbypartner = catchAsyncErrors(async (req, res, next) => {
  try {
    const order = await Order.find({
      DeliveryPersionId: req.params.partnerID,
    }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});
exports.UpdateOrder = catchAsyncErrors(async (req, res, next) => {
  try {
    let order = await Order.findById(req.body.orderId);
    if (!order) {
      return res.status(200).json({
        success: false,
        message: "order not found",
      });
    }
    const updatePayload = { ...req.body };
    if (updatePayload.status) {
      updatePayload.status = String(updatePayload.status).trim();
    }

    const isDelivered =
      updatePayload.order_status === 5 ||
      updatePayload.order_status === "5" ||
      updatePayload.status === "Delivered";

    const isCancelled =
      updatePayload.status === "Cancelled" ||
      updatePayload.order_status === "Cancelled" ||
      updatePayload.cancellationScenario;

    if (isDelivered) {
      updatePayload.payment_status = "Paid";
      if (!updatePayload.deliveryVerifiedAt) {
        updatePayload.deliveryVerifiedAt = new Date();
      }
      if (!updatePayload.deliveryVerifiedBy && (order.DeliveryPersionId || req.body.DeliveryPersionId)) {
        updatePayload.deliveryVerifiedBy = order.DeliveryPersionId || req.body.DeliveryPersionId;
      }
    } else if (updatePayload.payment_status || updatePayload.paymentStatus) {
      updatePayload.payment_status = updatePayload.payment_status || updatePayload.paymentStatus;
    }
    delete updatePayload.paymentStatus;

    if (updatePayload.paymentMethod === "online") {
      updatePayload.payment_mode = "Online";
    } else if (updatePayload.paymentMethod === "cash") {
      updatePayload.payment_mode = "COD";
    } else if (updatePayload.paymentMethod === "wallet") {
      updatePayload.payment_mode = "Wallet";
    }

    order = await Order.findByIdAndUpdate(req.body.orderId, updatePayload, {
      new: true,
      useFindAndModify: false,
      runValidators: true,
    });

    if (isDelivered) {
      try {
        const restSettlement = await lockAndCreditRestaurantSettlement(order._id);
        if (restSettlement) {
          order.restaurantSettlement = restSettlement;
        }
      } catch (restErr) {
        console.error("Error locking restaurant settlement on UpdateOrder delivery:", restErr.message);
      }
    }

    // When order is marked Delivered (order_status: 5), lock settlement and create partner ledger entry
    if (isDelivered && (order.DeliveryPersionId || req.body.DeliveryPersionId)) {
      try {
        const lockRes = await lockAndCreditPartnerSettlement(
          order._id,
          order.DeliveryPersionId || req.body.DeliveryPersionId
        );
        if (lockRes?.settlement) {
          order.deliverySettlement = lockRes.settlement;
        }
      } catch (lockErr) {
        console.error("Error locking partner settlement on delivery:", lockErr.message);
      }
    } else if (isCancelled) {
      try {
        const config = await getActiveDeliveryConfig();
        const cancelScenario =
          req.body.cancellationScenario ||
          (order.DeliveryPersionId
            ? "orderCancelledAfterPickup"
            : "noPartnerAssigned");
        const cancelSettlement = calculateDeliveryPartnerEarning(order, config, {
          cancellationScenario: cancelScenario,
        });
        order.deliverySettlement = {
          ...cancelSettlement,
          settlementStatus: "CANCELLED",
        };
        await order.save();
      } catch (cancelErr) {
        console.error("Error updating cancellation settlement:", cancelErr.message);
      }
    }

    try {
      const io = req.app?.get("io");
      if (io) {
        const orderRoom = `order_${order._id}`;
        io.to(orderRoom).emit("order_status_update", {
          orderId: order._id,
          order_status: order.order_status,
          status: order.status,
          otp: order.otp,
          order,
        });

        if (order.DeliveryPersionId) {
          io.to(`rider_${order.DeliveryPersionId}`).emit("order:updated", {
            order,
            orderId: order._id,
            status: order.status,
            order_status: order.order_status,
          });
        }

        io.to("all_riders").emit("order:updated", { order });
        io.to("admin_room").emit("admin:order_updated", {
          order,
          orderId: order._id,
          status: order.status,
          order_status: order.order_status,
        });
      }
    } catch (socketErr) {
      console.error("Socket emission error in UpdateOrder:", socketErr.message);
    }

    // Send FCM Push to Customer upon EVERY order status update (no restriction, delivers even when customer app is CLOSED / KILLED)
    if (order.userId) {
      const orderNum = order.orderNumber || `#${String(order._id).slice(-6).toUpperCase()}`;
      let customerTitle = `Order Update: ${order.status || "Updated"}`;
      let customerBody = `Your order ${orderNum} status is now ${order.status || "updated"}.`;

      if (isDelivered) {
        customerTitle = "Order Delivered! 🎉";
        customerBody = `Your order ${orderNum} has been delivered. Enjoy your meal!`;
      } else if (isCancelled) {
        customerTitle = "Order Cancelled ❌";
        customerBody = `Your order ${orderNum} has been cancelled.`;
      } else if (
        order.order_status === 4 ||
        String(order.status).toLowerCase().includes("way") ||
        String(order.status).toLowerCase().includes("pick")
      ) {
        const otpText = order.otp ? ` (OTP: ${order.otp})` : "";
        customerTitle = `Order Out for Delivery! 🛵${otpText}`;
        customerBody = `Your order ${orderNum} has been picked up and is on the way.${order.otp ? ` Share delivery OTP: ${order.otp} with delivery partner.` : ""}`;
      } else if (
        order.order_status === 2 ||
        String(order.status).toLowerCase().includes("prepar")
      ) {
        customerTitle = "Order Being Prepared 🍳";
        customerBody = `${order.restauntName || "Restaurant"} is preparing your order ${orderNum}.`;
      } else if (
        order.order_status === 1 ||
        String(order.status).toLowerCase().includes("accept") ||
        String(order.status).toLowerCase().includes("confirm")
      ) {
        customerTitle = "Order Accepted! ✅";
        customerBody = `${order.restauntName || "Restaurant"} accepted your order ${orderNum}.`;
      } else if (String(order.status).toLowerCase().includes("ready")) {
        customerTitle = "Food is Ready! 🍲";
        customerBody = `Your order ${orderNum} is freshly prepared and ready.`;
      }

      sendCustomerFcmNotification(order.userId, {
        title: customerTitle,
        body: customerBody,
        data: {
          orderId: String(order._id),
          order_status: String(order.order_status || ""),
          status: String(order.status || ""),
          otp: String(order.otp || ""),
          type: "order_status_update",
          category: "orders",
          statusKey: String(order.status || "").toLowerCase().replace(/\s+/g, "_"),
          route: "TrackOrderScreen",
        },
      }).catch((err) => console.log("[FCM Push Customer Note]:", err?.message));
    }

    // Send FCM Push to Rider for EVERY status update (no restriction, delivers even when rider app is CLOSED / KILLED)
    if (order.DeliveryPersionId) {
      const orderNum = order.orderNumber || `#${String(order._id).slice(-6).toUpperCase()}`;
      let riderTitle = `Order Update: ${order.status || "Updated"}`;
      let riderBody = `Order ${orderNum} status updated to ${order.status || "updated"}.`;

      if (isCancelled) {
        riderTitle = "Order Cancelled ❌";
        riderBody = `Order ${orderNum} has been cancelled.`;
      } else if (isDelivered) {
        riderTitle = "Order Delivered! 🎉";
        riderBody = `Order ${orderNum} has been marked delivered.`;
      } else if (String(order.status).toLowerCase().includes("ready")) {
        riderTitle = "Food Ready for Pickup! 🍲";
        riderBody = `Order ${orderNum} at ${order.restauntName || "the restaurant"} is ready for pickup.`;
      } else if (String(order.status).toLowerCase().includes("prepar")) {
        riderTitle = "Order Being Prepared 🍳";
        riderBody = `${order.restauntName || "Restaurant"} is preparing order ${orderNum}.`;
      } else if (
        String(order.status).toLowerCase().includes("way") ||
        String(order.status).toLowerCase().includes("pick")
      ) {
        riderTitle = "Order Out for Delivery 🛵";
        riderBody = `Order ${orderNum} is out for delivery.`;
      }

      sendRiderFcmNotification(order.DeliveryPersionId, {
        title: riderTitle,
        body: riderBody,
        data: {
          orderId: String(order._id),
          riderId: String(order.DeliveryPersionId),
          type: isCancelled ? "order_cancelled" : "order_status_update",
          statusKey: String(order.status || "").toLowerCase().replace(/\s+/g, "_"),
          route: "HomeScreen",
        },
      }).catch((err) => console.log("[FCM Push Rider Note]:", err?.message));
    }

    return res.status(200).json({
      success: true,
      order: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});

exports.verifyDelivery = catchAsyncErrors(async (req, res) => {
  const { orderId, otp, deliveryPartnerId, paymentMethod } = req.body;
  const verificationOtp = String(otp || "").trim();

  if (!orderId || !deliveryPartnerId || !verificationOtp) {
    return res.status(400).json({
      success: false,
      message: "Order, rider, and delivery OTP are required",
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({success: false, message: "Order not found"});
  }

  if (order.order_mode !== "Delivery") {
    return res.status(400).json({
      success: false,
      message: "Only delivery orders can be verified this way",
    });
  }

  if (Number(order.order_status) === 5 || order.status === "Delivered") {
    return res.status(409).json({
      success: false,
      message: "This order has already been delivered",
    });
  }

  if (
    !order.DeliveryPersionId ||
    String(order.DeliveryPersionId) !== String(deliveryPartnerId)
  ) {
    return res.status(403).json({
      success: false,
      message: "This order is not assigned to this delivery partner",
    });
  }

  const expectedOtp = String(order.otp || "").trim();
  if (expectedOtp !== verificationOtp) {
    return res.status(400).json({success: false, message: "Invalid delivery OTP"});
  }

  const isWallet =
    String(order.payment_mode || "").toUpperCase() === "WALLET" ||
    paymentMethod === "wallet";
  const shouldMarkDelivered = isWallet || Boolean(paymentMethod);

  if (!shouldMarkDelivered) {
    // For COD orders, OTP is verified but order status remains untouched
    // until rider selects Cash or Online and confirms.
    return res.status(200).json({
      success: true,
      otpVerified: true,
      isCompleted: false,
      message: "Delivery OTP verified. Please collect payment.",
      order,
    });
  }

  const updateFields = {
    status: "Delivered",
    order_status: 5,
    payment_status: "Paid",
    deliveryVerifiedAt: new Date(),
    deliveryVerifiedBy: deliveryPartnerId,
  };
  if (paymentMethod === "online") {
    updateFields.payment_mode = "Online";
  } else if (paymentMethod === "cash") {
    updateFields.payment_mode = "COD";
  } else if (paymentMethod === "wallet" || isWallet) {
    updateFields.payment_mode = "Wallet";
  }

  let verifiedOrder = await Order.findByIdAndUpdate(
    orderId,
    updateFields,
    {new: true, runValidators: true},
  );

  try {
    const lockRes = await lockAndCreditPartnerSettlement(
      verifiedOrder._id,
      deliveryPartnerId,
    );
    if (lockRes?.settlement) {
      verifiedOrder.deliverySettlement = lockRes.settlement;
    }
  } catch (lockErr) {
    console.error("Error locking partner settlement on verified delivery:", lockErr.message);
  }

  try {
    const restSettlement = await lockAndCreditRestaurantSettlement(verifiedOrder._id);
    if (restSettlement) {
      verifiedOrder.restaurantSettlement = restSettlement;
    }
  } catch (restErr) {
    console.error("Error locking restaurant settlement on verified delivery:", restErr.message);
  }

  const io = req.app.get("io");
  io?.to(`order_${verifiedOrder._id}`).emit("order_status_update", {
    orderId: String(verifiedOrder._id),
    order_status: 5,
    status: "Delivered",
  });

  // Send FCM Push to Customer upon verified delivery (works even when customer app is CLOSED / KILLED)
  if (verifiedOrder.userId) {
    const orderNum = verifiedOrder.orderNumber || `#${String(verifiedOrder._id).slice(-6).toUpperCase()}`;
    sendCustomerFcmNotification(verifiedOrder.userId, {
      title: "Order Delivered Successfully! 🎉",
      body: `Your order ${orderNum} has been delivered. Thank you for choosing Foodzy!`,
      data: {
        orderId: String(verifiedOrder._id),
        order_status: "5",
        status: "Delivered",
        type: "order_status_update",
        category: "orders",
        statusKey: "delivered",
        route: "TrackOrderScreen",
      },
    }).catch(() => {});
  }

  // Send FCM Push to Rider with earnings summary (works even when rider app is CLOSED / KILLED)
  if (deliveryPartnerId) {
    const orderNum = verifiedOrder.orderNumber || `#${String(verifiedOrder._id).slice(-6).toUpperCase()}`;
    const earning = verifiedOrder.deliverySettlement?.totalPartnerEarning || "earnings";
    sendRiderFcmNotification(deliveryPartnerId, {
      title: "Delivery Completed! 💰",
      body: `Order ${orderNum} completed! ₹${earning} credited to your earnings wallet.`,
      data: {
        orderId: String(verifiedOrder._id),
        type: "order_completed",
        statusKey: "delivered",
        route: "EarningsScreen",
      },
    }).catch(() => {});
  }

  return res.status(200).json({success: true, order: verifiedOrder});
});

exports.Orderacceptbypartner = catchAsyncErrors(async (req, res, next) => {
  try {
    let order = await Order.findById(req.body.orderId);
    if (!order) {
      return res.status(200).json({
        success: false,
        message: "order not found",
      });
    }
    if (
      order.DeliveryPersionId &&
      String(order.DeliveryPersionId).trim() !== "" &&
      String(order.DeliveryPersionId) !== "null"
    ) {
      return res.status(200).json({
        success: false,
        massage: "Order already accepted by someone",
      });
    } else {
      const updateData = { ...req.body };
      const restId = order.restauntId || order.restaurantId;
      if (restId) {
        try {
          const restaurant = await Restaurant.findById(restId);
          if (restaurant) {
            if (restaurant.Latitude && restaurant.Longitude) {
              updateData.restauntLatitude = String(restaurant.Latitude);
              updateData.restauntLongitude = String(restaurant.Longitude);
            }
            if (restaurant.address) {
              updateData.restauntAddress = restaurant.address;
            }
            if (restaurant.name) {
              updateData.restauntName = restaurant.name;
            }
          }
        } catch (_) {}
      }

      // Calculate initial preview if settlement is missing or uncalculated
      if (!order.deliverySettlement || !order.deliverySettlement.totalPartnerEarning) {
        try {
          const config = await getActiveDeliveryConfig();
          const settlement = calculateDeliveryPartnerEarning(
            { ...order.toObject(), ...updateData },
            config
          );
          updateData.deliverySettlement = {
            ...settlement,
            settlementStatus: "PENDING",
          };
          if (settlement.distanceKm > 0) {
            updateData.distance = `${settlement.distanceKm} km`;
          }
        } catch (calcErr) {
          console.error("Settlement calculation on accept error:", calcErr.message);
        }
      }

      order = await Order.findByIdAndUpdate(req.body.orderId, updateData, {
        new: true,
        useFindAndModify: false,
        runValidators: true,
      });
      await OrderRequiest.deleteMany({ OrderId: req.body.orderId });
      try {
        const io = req.app?.get("io");
        if (io) {
          io.to(`order_${order._id}`).emit("order_status_update", {
            orderId: order._id,
            order_status: 3,
            status: "Rider Assigned and Heading to Restaurant",
            rider: {
              id: order.DeliveryPersionId,
              name: order.delivery_persion_name,
              phone: order.delivery_persion_phone,
            },
            order,
          });

          if (order.DeliveryPersionId) {
            io.to(`rider_${order.DeliveryPersionId}`).emit("order:assigned", {
              order,
              orderId: order._id,
            });
          }

          io.to("all_riders").emit("order:updated", { order });
        }
      } catch (socketErr) {
        console.error("Socket emission error in Orderacceptbypartner:", socketErr.message);
      }

      // Send FCM Push to Customer when rider accepts (works even when customer app is CLOSED / KILLED)
      if (order.userId) {
        const orderNum = order.orderNumber || `#${String(order._id).slice(-6).toUpperCase()}`;
        const riderName = order.delivery_persion_name || "A delivery partner";
        sendCustomerFcmNotification(order.userId, {
          title: "Rider Assigned to Your Order! 🚴",
          body: `${riderName} has accepted your order ${orderNum} and is heading to the restaurant.`,
          data: {
            orderId: String(order._id),
            order_status: "3",
            status: "Rider Assigned",
            type: "order_status_update",
            category: "orders",
            statusKey: "rider_assigned",
            route: "TrackOrderScreen",
          },
        }).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        order: order,
        massage: "Congratulations you got this order",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});
exports.PartnerOrderbyweekly = catchAsyncErrors(async (req, res, next) => {
  try {
    // Set up date range for the last 2 months
    const endDate = new Date();
    const startDate = moment(endDate).subtract(2, "months").toDate();
    let orders = await Order.aggregate([
      {
        $match: {
          DeliveryPersionId: req.params.partnerId,
        },
      },
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalOrderAmount: {
            $sum: {
              $cond: [
                { $gt: ["$deliverySettlement.totalPartnerEarning", 0] },
                "$deliverySettlement.totalPartnerEarning",
                {
                  $add: [
                    { $ifNull: ["$delivery_Charge", 0] },
                    { $ifNull: ["$rain_fee", 0] },
                    { $ifNull: ["$delivery_tip", 0] },
                  ],
                },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});
exports.PartnerOrderbyday = catchAsyncErrors(async (req, res, next) => {
  try {
    // Set up date range for the last 2 months
    const startDate = moment().subtract(2, "months").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();
    let orders = await Order.aggregate([
      {
        $match: {
          DeliveryPersionId: req.params.partnerId,
        },
      },
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalAmount: {
            $sum: {
              $cond: [
                { $gt: ["$deliverySettlement.totalPartnerEarning", 0] },
                "$deliverySettlement.totalPartnerEarning",
                {
                  $add: [
                    { $ifNull: ["$delivery_Charge", 0] },
                    { $ifNull: ["$rain_fee", 0] },
                    { $ifNull: ["$delivery_tip", 0] },
                  ],
                },
              ],
            },
          },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});
exports.PartnerdaywiseOrder = catchAsyncErrors(async (req, res, next) => {
  try {
    let date = moment(req.body.date, "DD-MM-YYYY");
    let startOfDay = date.startOf("day").toDate();
    let endOfDay = date.endOf("day").toDate();

    let orders = await Order.find({
      $and: [
        { DeliveryPersionId: req.body.partnerId },
        {
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      ],
    });

    res.status(200).json({
      success: true,
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});
exports.PartnerOrderbyWeek = catchAsyncErrors(async (req, res, next) => {
  try {
    const startDate = moment()
      .year(req.body.year)
      .isoWeek(req.body.week)
      .startOf("isoWeek")
      .toDate();
    const endDate = moment()
      .year(req.body.year)
      .isoWeek(req.body.week)
      .endOf("isoWeek")
      .toDate();

    let orders = await Order.aggregate([
      {
        $match: {
          DeliveryPersionId: req.body.partnerId,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by day
          },
          totalOrderAmount: {
            $sum: {
              $cond: [
                { $gt: ["$deliverySettlement.totalPartnerEarning", 0] },
                "$deliverySettlement.totalPartnerEarning",
                {
                  $add: [
                    { $ifNull: ["$delivery_Charge", 0] },
                    { $ifNull: ["$rain_fee", 0] },
                    { $ifNull: ["$delivery_tip", 0] },
                  ],
                },
              ],
            },
          },
          orderCount: { $sum: 1 }, // Count orders for each day
        },
      },
      {
        $sort: { "_id.date": 1 }, // Sort by day in ascending order
      },
    ]);

    res.status(200).json({
      success: true,
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

exports.createRazorpayPaymentLink = catchAsyncErrors(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: "Order ID is required" });
  }

  const razorpay = getRazorpayClient();
  if (!razorpay) {
    return res.status(503).json({
      success: false,
      message: "Online payments are not configured. Add Razorpay API credentials on the server.",
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const amount = getOrderPaymentAmount(order);
  if (!amount) {
    return res.status(400).json({ success: false, message: "A valid order amount is required" });
  }

  if (
    order.onlinePayment?.provider === "razorpay" &&
    order.onlinePayment?.paymentLinkUrl &&
    order.onlinePayment?.status === "created" &&
    Number(order.onlinePayment?.amount) === amount
  ) {
    return res.status(200).json({
      success: true,
      paymentLink: {
        id: order.onlinePayment.paymentLinkId,
        url: order.onlinePayment.paymentLinkUrl,
        amount,
        status: order.onlinePayment.status,
      },
    });
  }

  const referenceId = `FZ-${String(order._id).slice(-16)}-${Date.now().toString().slice(-8)}`;
  const paymentLink = await razorpay.paymentLink.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    accept_partial: false,
    reference_id: referenceId,
    description: `Foodzy order ${String(order.orderNumber || order._id).slice(-8)}`,
    customer: {
      name: order.Username || order.userName || "Foodzy customer",
      contact: String(order.Usermobile || order.userMobile || "").replace(/\D/g, "") || undefined,
    },
    notify: { sms: false, email: false },
    reminder_enable: false,
    expire_by: Math.floor(Date.now() / 1000) + 30 * 60,
    notes: { foodzyOrderId: String(order._id) },
  });

  order.onlinePayment = {
    provider: "razorpay",
    paymentLinkId: paymentLink.id,
    paymentLinkUrl: paymentLink.short_url,
    amount,
    status: paymentLink.status || "created",
    createdAt: new Date(),
  };
  await order.save();

  return res.status(201).json({
    success: true,
    paymentLink: {
      id: paymentLink.id,
      url: paymentLink.short_url,
      amount,
      status: paymentLink.status || "created",
    },
  });
});

exports.getRazorpayPaymentLinkStatus = catchAsyncErrors(async (req, res) => {
  const { orderId } = req.params;
  const razorpay = getRazorpayClient();

  if (!razorpay) {
    return res.status(503).json({ success: false, message: "Online payments are not configured." });
  }

  const order = await Order.findById(orderId);
  if (!order?.onlinePayment?.paymentLinkId) {
    return res.status(404).json({ success: false, message: "Payment link not found for this order." });
  }

  const paymentLink = await razorpay.paymentLink.fetch(order.onlinePayment.paymentLinkId);
  order.onlinePayment.status = paymentLink.status || order.onlinePayment.status;
  if (paymentLink.status === "paid" && !order.onlinePayment.paidAt) {
    order.onlinePayment.paidAt = new Date();
  }
  await order.save();

  return res.status(200).json({
    success: true,
    status: paymentLink.status,
    paymentId: paymentLink.payments?.[0]?.payment_id || "",
  });
});

exports.getRoadRouteProxy = catchAsyncErrors(async (req, res, next) => {
  const { originLat, originLng, destLat, destLng } = req.query;

  if (!originLat || !originLng || !destLat || !destLng) {
    return res.status(400).json({
      success: false,
      message: "Missing coordinates",
    });
  }

  const oLat = Number(originLat);
  const oLng = Number(originLng);
  const dLat = Number(destLat);
  const dLng = Number(destLng);

  // 1. Try Google Directions API
  const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyDfjw4P4PnfI08-B-ljZDhEeQxnBqNv3hQ";
  try {
    const googleRes = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&mode=driving&key=${GOOGLE_KEY}`
    );
    const googleData = await googleRes.json();
    if (googleData?.status === "OK" && googleData.routes?.length > 0) {
      const polyline = require("@mapbox/polyline");
      const encoded = googleData.routes[0].overview_polyline?.points;
      if (encoded) {
        const decoded = polyline.decode(encoded).map(([lat, lng]) => ({
          latitude: Number(lat),
          longitude: Number(lng),
        }));
        const leg = googleData.routes[0].legs?.[0];
        const distKm = leg?.distance?.value ? Math.round((leg.distance.value / 1000) * 10) / 10 : 1;
        const durMin = leg?.duration?.value ? Math.max(1, Math.round(leg.duration.value / 60)) : 5;
        return res.status(200).json({
          success: true,
          coordinates: decoded,
          distanceKm: distKm,
          distanceText: leg?.distance?.text || `${distKm} km`,
          durationMinutes: durMin,
          durationText: leg?.duration?.text || `${durMin} mins`,
        });
      }
    }
  } catch (_gErr) {}

  // 2. Try OSRM
  try {
    const osrmRes = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`
    );
    const osrmData = await osrmRes.json();
    if (osrmData?.routes?.length > 0) {
      const route = osrmData.routes[0];
      const coordinates = route.geometry.coordinates.map(([lng, lat]) => ({
        latitude: Number(lat),
        longitude: Number(lng),
      }));
      const distKm = Math.round((route.distance / 1000) * 10) / 10;
      const durMin = Math.max(1, Math.round(route.duration / 60));
      return res.status(200).json({
        success: true,
        coordinates,
        distanceKm: distKm,
        distanceText: `${distKm} km`,
        durationMinutes: durMin,
        durationText: `${durMin} mins`,
      });
    }
  } catch (_oErr) {}

  return res.status(200).json({
    success: false,
    coordinates: [],
  });
});

