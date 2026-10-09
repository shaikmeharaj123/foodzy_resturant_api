const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Name"],
      trim: true,
    },
    mobile: {
      type: Number,
      unique: [true, "mobile already exist"],
      minlength: [10, "mobile should be 10 characters"],
      maxlength: [10, "mobile should be 10 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please Provide Email"],
      unique: [true, "email already exist"],
      validate: [validator.isEmail, "Please Enter a Valid Email"],
    },
    avatar: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      default: "",
    },
    fcmToken: {
      type: String,
      default: "",
    },
    veg: {
      type: Boolean,
      default: false,
    },
    WalletBalance: {
      type: Number,
      default: 0,
    },
     walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    address: [
      {
        Latitude: {
          type: String,
        },
        Longitude: {
          type: String,
        },
        address: {
          type: String,
        },
        house_no: {
          type: String,
        },
        landmark: {
          type: String,
        },
        type: {
          type: String,
        },
        prime: {
          type: Boolean,
          default: false,
        },
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  // { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
