const express = require("express");
const {
  sendOtp,
  verifyOtp,
  resendOtp,
  sendOtpNewRestaurant,
} = require("../controllers/OtpController");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/send-otp-new-restaurant", sendOtpNewRestaurant);

module.exports = router;
