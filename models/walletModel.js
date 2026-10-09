const mongoose = require("mongoose");

const walletSchema = mongoose.Schema(
  {
    ClientId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    previousAmount: {
      type: [
        {
          amount: {
            type: Number,
            default: 0,
          },
          addedAmount: {
            type: Number,
            default: 0,
          },
          transactionType: {
            type: String,
            enum: ["credit", "debit", "cashback", "refund", "subscription"],
            default: "credit",
          },
          txnId: {
            type: String,
            default: "",
          },
          orderId: {
            type: String,
          },
          subscriptionId: {
            type: String,
          },
          paymentStatus: {
            type: String,
          },
          paymentId: {
            type: String,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
          updatedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    availableAmount: {
      type: Number,
      default: 0,
    },
    transactionAmount: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
);

// Add indexes for better query performance
walletSchema.index({ ClientId: 1, createdAt: -1 });
walletSchema.index({ ClientId: 1 }, { unique: true });
walletSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Wallet", walletSchema);
