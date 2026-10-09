const mongoose = require("mongoose");
const validator = require("validator");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Name"],
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
    mobile: {
      type: Number,
      unique: [true, "mobile already exist"],
      trim: true,
      required: [true, "Please Provide mobile"],
    },
    role: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
