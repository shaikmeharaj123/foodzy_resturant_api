const mongoose = require("mongoose");

const breakdownSchema = new mongoose.Schema(
  {
    basePay: { type: Number, default: 0 },
    distancePay: { type: Number, default: 0 },
    peakPay: { type: Number, default: 0 },
    rainPay: { type: Number, default: 0 },
    demandPay: { type: Number, default: 0 },
    incentiveAmount: { type: Number, default: 0 },
    deliveryTip: { type: Number, default: 0 },
  },
  { _id: false }
);

const partnerLedgerSchema = new mongoose.Schema(
  {
    deliveryPartnerId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "deliveryPartnerId is required"],
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "orderId is required"],
      index: true,
    },
    type: {
      type: String,
      enum: [
        "DELIVERY_EARNING",
        "CANCELLATION_COMPENSATION",
        "INCENTIVE",
        "TIP_CREDIT",
        "ADJUSTMENT",
      ],
      default: "DELIVERY_EARNING",
    },
    amount: {
      type: Number,
      required: [true, "amount is required"],
    },
    breakdown: {
      type: breakdownSchema,
      default: () => ({}),
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "CREDITED", "FAILED", "REVERSED"],
      default: "CREDITED",
    },
    remarks: {
      type: String,
      default: "Delivery payout credited",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate ledger entries for the same order, partner, and transaction type
partnerLedgerSchema.index(
  { orderId: 1, deliveryPartnerId: 1, type: 1 },
  { unique: true }
);

module.exports = mongoose.model("PartnerLedger", partnerLedgerSchema);
