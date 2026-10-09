const mongoose = require("mongoose");
const validator = require("validator");

const DeliveryPersionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Name"],
    trim: true,
  },
  mobile: {
    type: String,
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
  gender: {
    type: String,
    default: "male",
  },
  vehicleNumber: {
    type: String,
    trim: true,
  },
  valid_id: {
    type: String,
    trim: true,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  profileImage: {
    type: String,
    default: "",
  },
  bikeRC: {
    type: String,
    default: "",
  },
  aadharCard: {
    type: String,
    default: "",
  },
  logo: {
    type: String,
    default: "",
  },
  bankName: {
    type: String,
    default: "",
  },
  accountNumber: {
    type: String,
    default: "",
  },
  ifscCode: {
    type: String,
    default: "",
  },
  upiId: {
    type: String,
    default: "",
  },
  Latitude: {
    type: String,
    default: "17.4483",
  },
  Longitude: {
    type: String,
    default: "78.3915",
  },
  revenue: {
    type: Number,
    default: 0,
  },
  status: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  riderStatus: {
    type: String,
    default: "online", // online, offline, busy
  },
  rating: {
    type: Number,
    default: 5,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  fcmToken: {
    type: String,
    default: "",
  },
  collectionCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
  },
  collectionCenterName: {
    type: String,
    default: "",
  },
  reVerificationRequired: {
    type: Boolean,
    default: false,
  },
  reVerificationFields: {
    type: [String],
    default: [],
  },
  reVerificationReason: {
    type: String,
    default: "",
  },
  reVerificationDate: {
    type: Date,
  },
  vehicleVerificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected", "not_required"],
    default: "pending",
  },
  documentVerificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected", "not_required"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DeliveryPersion", DeliveryPersionSchema);
