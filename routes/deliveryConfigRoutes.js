const express = require("express");
const {
  getDeliveryConfig,
  updateDeliveryConfig,
  previewPartnerEarnings,
  getPartnerLedger,
  getAdminSettlementsSummary,
  getDeliveryPartnersSettlements,
  settlePartnerPayout,
  requestPartnerWithdrawal,
  getRestaurantsSettlements,
  settleRestaurantPayout,
  notifyRiderOrBroadcast,
  updateRiderFcmToken,
} = require("../controllers/DeliveryConfigController");

const router = express.Router();

router.route("/").get(getDeliveryConfig).put(updateDeliveryConfig);
router.route("/calculate-preview").post(previewPartnerEarnings);
router.route("/partner-ledger/:partnerId").get(getPartnerLedger);
router.route("/settlements-summary").get(getAdminSettlementsSummary);
router.route("/partners-settlement-summary").get(getDeliveryPartnersSettlements);
router.route("/settle-partner").post(settlePartnerPayout);
router.route("/partner-withdraw").post(requestPartnerWithdrawal);
router.route("/restaurants-settlement-summary").get(getRestaurantsSettlements);
router.route("/settle-restaurant").post(settleRestaurantPayout);
router.route("/notify-rider").post(notifyRiderOrBroadcast);
router.route("/update-rider-fcm-token").post(updateRiderFcmToken);

module.exports = router;

