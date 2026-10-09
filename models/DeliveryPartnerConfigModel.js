const mongoose = require("mongoose");

const distanceSlabSchema = new mongoose.Schema(
  {
    minKm: { type: Number, required: true, default: 0 },
    maxKm: { type: Number, required: true, default: 3 },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const peakPeriodSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Peak Period" },
    start: { type: String, required: true, default: "12:00" }, // 24-hour format HH:mm
    end: { type: String, required: true, default: "15:00" },
    extraPay: { type: Number, required: true, default: 10 },
  },
  { _id: false }
);

const cancellationRuleSchema = new mongoose.Schema(
  {
    partnerPayout: { type: Number, default: 0 },
    isPercentage: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const deliveryPartnerConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      unique: true,
      default: "GLOBAL_DEFAULT",
    },
    basePay: {
      type: Number,
      required: true,
      default: 25,
    },
    distanceSlabs: {
      type: [distanceSlabSchema],
      default: [
        { minKm: 0, maxKm: 3, amount: 0 },
        { minKm: 3, maxKm: 5, amount: 5 },
        { minKm: 5, maxKm: 7, amount: 10 },
        { minKm: 7, maxKm: 999999, amount: 15 },
      ],
    },
    enablePeakPay: {
      type: Boolean,
      default: true,
    },
    peakPeriods: {
      type: [peakPeriodSchema],
      default: [
        { name: "Lunch Peak", start: "12:00", end: "15:00", extraPay: 10 },
        { name: "Dinner Peak", start: "19:00", end: "22:30", extraPay: 10 },
      ],
    },
    enableRainPay: {
      type: Boolean,
      default: false,
    },
    rainPay: {
      type: Number,
      default: 10,
    },
    rainZones: {
      type: [String],
      default: [], // Specific cities/zones if rain is active
    },
    demandSurgeLevel: {
      type: String,
      enum: ["NORMAL", "HIGH", "VERY_HIGH"],
      default: "NORMAL",
    },
    demandSurgeOptions: [
      {
        level: { type: String, default: "NORMAL" },
        amount: { type: Number, default: 0 },
      },
    ],
    extraDemandPay: {
      type: Number,
      default: 0,
    },
    incentiveAmount: {
      type: Number,
      default: 0,
    },
    minimumPartnerPayout: {
      type: Number,
      default: 25,
    },
    cancellationRules: {
      restaurantRejected: {
        type: cancellationRuleSchema,
        default: { partnerPayout: 0, description: "Restaurant rejected order" },
      },
      noPartnerAssigned: {
        type: cancellationRuleSchema,
        default: { partnerPayout: 0, description: "No partner assigned" },
      },
      partnerAssignedRestaurantCancels: {
        type: cancellationRuleSchema,
        default: { partnerPayout: 15, description: "Partner assigned but restaurant cancels" },
      },
      partnerReachedRestaurantCustomerCancels: {
        type: cancellationRuleSchema,
        default: { partnerPayout: 25, description: "Partner reached restaurant and customer cancels" },
      },
      orderCancelledAfterPickup: {
        type: cancellationRuleSchema,
        default: { partnerPayout: 30, description: "Order cancelled after pickup" },
      },
      completedDelivery: {
        type: cancellationRuleSchema,
        default: { partnerPayout: 0, description: "Full calculated payout" },
      },
    },
    updatedBy: {
      type: String,
      default: "Admin",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryPartnerConfig", deliveryPartnerConfigSchema);
