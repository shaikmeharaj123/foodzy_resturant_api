const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Doctor Name"],
      trim: true,
    },
    mobile: {
      type: Number,
    },
    age: {
      type: Number,
    },
    dutytimingStart: {
      type: String,
    },
    dutytimingEnd: {
      type: String,
    },
    typeofdoctor: {
      type: String,
    },
    imgUrl: {
      type: String,
      default: "",
    },
    permanentAddrs: {
      locality: {
        type: String,
      },
      area: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      pincode: {
        type: Number,
      },
      country: {
        type: String,
        default: "India",
      },
    },

    currentAddrs: {
      currentLocality: {
        type: String,
      },
      currentArea: {
        type: String,
      },
      currentCity: {
        type: String,
      },
      currentState: {
        type: String,
      },
      currentPincode: {
        type: Number,
      },
      currentCountry: {
        type: String,
        default: "India",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
