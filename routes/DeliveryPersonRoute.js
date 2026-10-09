const express = require("express");
const {
    createDeliveryPersion,
    verify_deliveryPersion_Number,
    verify_deliveryPersion_Email,
    verify_deliveryPersion_valid_id,
    send_JWS_token,
    get_protected_delivery_partner_data,
    getDeliveryPersionById,
    updateDeliveryPersion,
    toggleDeliveryPartnerStatus,
    getAllDeliveryPartners,
    uploadDeliveryPartnerImage,
} = require("../controllers/DeliveryPersionController");

const router = express.Router();
router.route("/new").post(createDeliveryPersion);
router.route("/all").get(getAllDeliveryPartners);
router.route("/upload-image").post(uploadDeliveryPartnerImage);
router.route("/verify-mobile/:mobile").get(verify_deliveryPersion_Number);
router.route("/verify-email/:email").get(verify_deliveryPersion_Email);
router.route("/verify-valid-id/:valid_id").get(verify_deliveryPersion_valid_id);
router.route("/send-jsw-token").post(send_JWS_token);
router.route("/get-protected-partner-data").post(get_protected_delivery_partner_data);
router.route("/get/:id").get(getDeliveryPersionById);
router.route("/:id").get(getDeliveryPersionById);
router.route("/update/:id").put(updateDeliveryPersion);
router.route("/toggle-status/:id").put(toggleDeliveryPartnerStatus);
router.route("/toggle-active/:id").put(toggleDeliveryPartnerStatus);

module.exports = router;


