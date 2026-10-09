const DeliveryPartnerConfig = require("../models/DeliveryPartnerConfigModel");
const PartnerLedger = require("../models/PartnerLedgerModel");
const moment = require("moment");

/**
 * Standard Haversine distance calculator between two geographic coordinates
 * @param {number|string} lat1
 * @param {number|string} lon1
 * @param {number|string} lat2
 * @param {number|string} lon2
 * @returns {number} distance in kilometers
 */
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (
    !Number.isFinite(nLat1) ||
    !Number.isFinite(nLon1) ||
    !Number.isFinite(nLat2) ||
    !Number.isFinite(nLon2) ||
    (nLat1 === 0 && nLon1 === 0) ||
    (nLat2 === 0 && nLon2 === 0)
  ) {
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place (e.g. 4.2 km)
}

/**
 * Check if a time HH:mm is within a given start and end range
 */
function isTimeWithinRange(timeStr, startStr, endStr) {
  if (!timeStr || !startStr || !endStr) return false;

  const [tH, tM] = timeStr.split(":").map(Number);
  const [sH, sM] = startStr.split(":").map(Number);
  const [eH, eM] = endStr.split(":").map(Number);

  const currentMinutes = tH * 60 + tM;
  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight window (e.g. 22:00 to 02:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

/**
 * Returns default delivery partner earnings configuration
 */
function getDefaultDeliveryConfig() {
  return {
    basePay: 25,
    distanceSlabs: [
      { minKm: 0, maxKm: 3, amount: 0 },
      { minKm: 3, maxKm: 5, amount: 5 },
      { minKm: 5, maxKm: 7, amount: 10 },
      { minKm: 7, maxKm: 999999, amount: 15 },
    ],
    enablePeakPay: true,
    peakPeriods: [
      { name: "Lunch Peak", start: "12:00", end: "15:00", extraPay: 10 },
      { name: "Dinner Peak", start: "19:00", end: "22:30", extraPay: 10 },
    ],
    enableRainPay: false,
    rainPay: 10,
    demandSurgeLevel: "NORMAL",
    demandSurgeOptions: [
      { level: "NORMAL", amount: 0 },
      { level: "HIGH", amount: 10 },
      { level: "VERY_HIGH", amount: 20 },
    ],
    extraDemandPay: 0,
    incentiveAmount: 0,
    minimumPartnerPayout: 25,
    cancellationRules: {
      restaurantRejected: { partnerPayout: 0, description: "Restaurant rejected order" },
      noPartnerAssigned: { partnerPayout: 0, description: "No partner assigned" },
      partnerAssignedRestaurantCancels: { partnerPayout: 15, description: "Partner assigned but restaurant cancels" },
      partnerReachedRestaurantCustomerCancels: { partnerPayout: 25, description: "Partner reached restaurant and customer cancels" },
      orderCancelledAfterPickup: { partnerPayout: 30, description: "Order cancelled after pickup" },
      completedDelivery: { partnerPayout: 0, description: "Full calculated payout" },
    },
  };
}

/**
 * Fetches active DeliveryPartnerConfig or creates default if non-existent
 */
async function getActiveDeliveryConfig() {
  try {
    let config = await DeliveryPartnerConfig.findOne({ configKey: "GLOBAL_DEFAULT" });
    if (!config) {
      const defaults = getDefaultDeliveryConfig();
      config = await DeliveryPartnerConfig.create({
        configKey: "GLOBAL_DEFAULT",
        ...defaults,
      });
    }
    return config;
  } catch (err) {
    console.error("Error retrieving delivery config, falling back to defaults:", err.message);
    return getDefaultDeliveryConfig();
  }
}

/**
 * Calculates delivery distance from order object or explicit coordinates
 */
function extractOrderDistanceKm(order) {
  if (!order) return 0;

  const restLat = order.restauntLatitude || order.restaurantLatitude;
  const restLng = order.restauntLongitude || order.restaurantLongitude;

  const userLat = order.userAddress?.Latitude || order.userLatitude;
  const userLng = order.userAddress?.Longitude || order.userLongitude;

  if (restLat && restLng && userLat && userLng) {
    const calc = calculateHaversineDistanceKm(restLat, restLng, userLat, userLng);
    if (calc > 0) return calc;
  }

  // Fallback if distance string already present on order (e.g., "4.2 km" or 4.2)
  if (order.distance) {
    const parsed = parseFloat(String(order.distance).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 0;
}

/**
 * Core Reusable Earnings Calculation Engine
 *
 * Formula:
 * deliveryPartnerEarning = basePay + distancePay + peakPay + rainPay + extraDemandPay + incentiveAmount + deliveryTip
 * (Subject to minimumPartnerPayout, GST/Commission excluded, 100% tip goes to partner)
 *
 * @param {object} order - Order document / payload
 * @param {object} config - Delivery partner configuration
 * @param {object} [options] - Additional calculation options (cancellationScenario, customTime, etc.)
 */
function calculateDeliveryPartnerEarning(order, config = null, options = {}) {
  const cfg = config || getDefaultDeliveryConfig();
  const opts = options || {};

  // 1. Distance Calculation
  const distanceKm = extractOrderDistanceKm(order);

  // 2. Cancellation scenario check
  if (opts.cancellationScenario && cfg.cancellationRules?.[opts.cancellationScenario]) {
    const cancelRule = cfg.cancellationRules[opts.cancellationScenario];
    const payout = Number(cancelRule.partnerPayout || 0);

    return {
      distanceKm,
      distanceUnit: "km",
      basePay: payout > 0 ? payout : 0,
      distancePay: 0,
      peakPay: 0,
      rainPay: 0,
      demandPay: 0,
      incentiveAmount: 0,
      deliveryTip: Number(order?.delivery_tip || 0),
      totalPartnerEarning: payout + Number(order?.delivery_tip || 0),
      settlementStatus: "CANCELLED",
      cancellationReason: cancelRule.description || opts.cancellationScenario,
      calculatedAt: new Date(),
    };
  }

  // 3. Base Pay
  const basePay = Number(cfg.basePay || 25);

  // 4. Distance Pay based on configured slabs
  let distancePay = 0;
  const slabs = Array.isArray(cfg.distanceSlabs) ? cfg.distanceSlabs : [];
  
  // Match distance against distance slabs
  for (const slab of slabs) {
    const min = Number(slab.minKm ?? 0);
    const max = Number(slab.maxKm ?? Infinity);
    if (distanceKm >= min && (distanceKm < max || (max === Infinity || slab.maxKm >= 999999))) {
      distancePay = Number(slab.amount || 0);
      break;
    }
  }

  // 5. Peak Pay Check
  let peakPay = 0;
  if (cfg.enablePeakPay && Array.isArray(cfg.peakPeriods)) {
    const now = opts.orderTime ? moment(opts.orderTime) : moment();
    const currentTimeStr = now.format("HH:mm");

    for (const period of cfg.peakPeriods) {
      if (isTimeWithinRange(currentTimeStr, period.start, period.end)) {
        peakPay = Number(period.extraPay || cfg.peakPay || 10);
        break;
      }
    }
  }

  // 6. Rain Pay Check
  let rainPay = 0;
  const isRainActive =
    cfg.enableRainPay ||
    Boolean(order?.rain_fee && order.rain_fee > 0) ||
    opts.rainMode === true;

  if (isRainActive) {
    rainPay = Number(cfg.rainPay || 10);
  }

  // 7. Extra Demand / Surge Pay
  let demandPay = 0;
  if (opts.extraDemandPay !== undefined) {
    demandPay = Number(opts.extraDemandPay || 0);
  } else if (cfg.extraDemandPay) {
    demandPay = Number(cfg.extraDemandPay || 0);
  } else if (cfg.demandSurgeLevel && Array.isArray(cfg.demandSurgeOptions)) {
    const matchedSurge = cfg.demandSurgeOptions.find(
      (s) => s.level === cfg.demandSurgeLevel
    );
    if (matchedSurge) {
      demandPay = Number(matchedSurge.amount || 0);
    }
  }

  // 8. Incentives
  const incentiveAmount = Number(opts.incentiveAmount ?? cfg.incentiveAmount ?? 0);

  // 9. Delivery Tip (100% to partner, no commissions deducted)
  const deliveryTip = Number(order?.delivery_tip || 0);

  // 10. Minimum partner payout check (applied on base subtotal before tip)
  const minPayout = Number(cfg.minimumPartnerPayout || 25);
  let subtotal = basePay + distancePay + peakPay + rainPay + demandPay + incentiveAmount;

  if (subtotal < minPayout) {
    subtotal = minPayout;
  }

  // Total partner earning
  const totalPartnerEarning = subtotal + deliveryTip;

  return {
    distanceKm,
    distanceUnit: "km",
    basePay,
    distancePay,
    peakPay,
    rainPay,
    demandPay,
    incentiveAmount,
    deliveryTip,
    totalPartnerEarning,
    settlementStatus: opts.settlementStatus || "ELIGIBLE",
    cancellationReason: "",
    calculatedAt: new Date(),
  };
}

/**
 * Locks and credits partner settlement when order is delivered or completed.
 * Adheres to Accounting Rule: Never recalculates completed orders with new rates.
 *
 * @param {string|object} orderId - Order ID
 * @param {string|object} partnerId - Delivery partner ID
 * @param {object} [options] - Options
 */
async function lockAndCreditPartnerSettlement(orderId, partnerId, options = {}) {
  const Order = require("../models/OrderModel");

  const order = await Order.findById(orderId);
  if (!order) {
    return { success: false, message: "Order not found" };
  }

  const riderId = partnerId || order.DeliveryPersionId;
  if (!riderId) {
    return { success: false, message: "No delivery partner assigned to order" };
  }

  // Accounting Rule #14: If settlement is already locked/completed, return existing without altering
  if (
    order.deliverySettlement &&
    order.deliverySettlement.totalPartnerEarning > 0 &&
    (order.deliverySettlement.settlementStatus === "ELIGIBLE" ||
      order.deliverySettlement.settlementStatus === "PAID") &&
    order.deliverySettlement.lockedAt
  ) {
    return {
      success: true,
      alreadyLocked: true,
      settlement: order.deliverySettlement,
    };
  }

  // Fetch active config and compute final locked breakdown
  const config = await getActiveDeliveryConfig();
  const breakdown = calculateDeliveryPartnerEarning(order, config, options);

  const lockedSettlement = {
    ...breakdown,
    settlementStatus: "ELIGIBLE",
    lockedAt: new Date(),
  };

  order.deliverySettlement = lockedSettlement;
  order.distance = `${breakdown.distanceKm} km`;
  await order.save();

  // Create Partner Ledger entry with duplicate protection
  let ledgerEntry = null;
  try {
    ledgerEntry = await PartnerLedger.create({
      deliveryPartnerId: riderId,
      orderId: order._id,
      type: "DELIVERY_EARNING",
      amount: breakdown.totalPartnerEarning,
      distanceKm: breakdown.distanceKm,
      breakdown: {
        basePay: breakdown.basePay,
        distancePay: breakdown.distancePay,
        peakPay: breakdown.peakPay,
        rainPay: breakdown.rainPay,
        demandPay: breakdown.demandPay,
        incentiveAmount: breakdown.incentiveAmount,
        deliveryTip: breakdown.deliveryTip,
      },
      status: "CREDITED",
      remarks: `Payout credited for Order #${order._id}`,
    });
  } catch (ledgerErr) {
    if (ledgerErr.code === 11000) {
      // Duplicate ledger entry already existed; find it
      ledgerEntry = await PartnerLedger.findOne({
        orderId: order._id,
        deliveryPartnerId: riderId,
        type: "DELIVERY_EARNING",
      });
    } else {
      console.error("Ledger creation error:", ledgerErr);
    }
  }

  return {
    success: true,
    settlement: lockedSettlement,
    ledger: ledgerEntry,
  };
}

/**
 * Lock and calculate Restaurant (Shop) payout settlement for an order
 * Formula: foodSubtotal - platformCommission (default 15% or restaurant.delivery_Commission)
 */
async function lockAndCreditRestaurantSettlement(orderId) {
  const Order = require("../models/OrderModel");
  const Restaurant = require("../models/RestaurantModel");

  const order = await Order.findById(orderId);
  if (!order) {
    return null;
  }

  // If already settled/paid, do not overwrite
  if (
    order.restaurantSettlement &&
    order.restaurantSettlement.settlementStatus === "PAID"
  ) {
    return order.restaurantSettlement;
  }

  let commissionRate = 15;
  let restaurant = null;

  if (order.restauntId) {
    restaurant = await Restaurant.findById(order.restauntId);
    if (restaurant?.delivery_Commission && !isNaN(Number(restaurant.delivery_Commission))) {
      commissionRate = Number(restaurant.delivery_Commission);
    }
  }

  const foodSubtotal =
    Number(order.total_Amount) ||
    Number(order.restaurent_total_Amount) ||
    Math.max(
      0,
      Number(order.grand_total || 0) -
        Number(order.delivery_Charge || 0) -
        Number(order.platform_fee || 0) -
        Number(order.delivery_tip || 0)
    );

  const commissionAmount = Math.round(foodSubtotal * (commissionRate / 100));
  const netPayout = Math.max(0, foodSubtotal - commissionAmount);

  const settlement = {
    foodSubtotal,
    commissionRate,
    commissionAmount,
    gst: Number(order.gst || order.restaurent_gst || 0),
    netPayout,
    settlementStatus: "ELIGIBLE",
    calculatedAt: new Date(),
  };

  order.restaurantSettlement = settlement;
  order.restaurent_total_Amount = foodSubtotal;
  order.restaurent_total_net_payable = netPayout;
  await order.save();

  if (restaurant) {
    await Restaurant.findByIdAndUpdate(restaurant._id, {
      $inc: { revenue: netPayout },
    });
  }

  return settlement;
}

module.exports = {
  calculateHaversineDistanceKm,
  isTimeWithinRange,
  getDefaultDeliveryConfig,
  getActiveDeliveryConfig,
  extractOrderDistanceKm,
  calculateDeliveryPartnerEarning,
  lockAndCreditPartnerSettlement,
  lockAndCreditRestaurantSettlement,
};
