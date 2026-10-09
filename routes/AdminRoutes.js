const express = require("express");
const {
    createAdmin,
    send_JWS_token,
    get_protected_admin_data,
    mobileExist,
    emailExist,
    update_admin,
    send_email,
    optSendwithVerification
} = require("../controllers/AdminController");

const router = express.Router();
router.route("/new").post(createAdmin);
router.route("/send-jsw-token").post(send_JWS_token);
router.route("/get-protected-admin-data").post(get_protected_admin_data);
router.route("/send-otp").post(optSendwithVerification);
router.route("/mobile/:mobile").get(mobileExist);
router.route("/email/:email").get(emailExist);
router.route("/update").put(update_admin);
router.route("/send-email").post(send_email);

module.exports = router;
