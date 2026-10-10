const express = require("express");
const {
  sendOtp,
  verifyOtp,
  resendOtp,
  sendOtpNewRestaurant,
  sendPhoneChangeOtp,
  verifyPhoneChangeOtp,
} = require("../controllers/OtpController");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/send-otp-new-restaurant", sendOtpNewRestaurant);
router.post("/send-phone-change-otp", sendPhoneChangeOtp);
router.post("/verify-phone-change-otp", verifyPhoneChangeOtp);

module.exports = router;
