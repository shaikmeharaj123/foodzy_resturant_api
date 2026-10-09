const express = require("express");
const {
    createOrder,
    getOrderbyUserId,
    getOrderbyRestaurantId,
    UpdateOrder,
    getSingleOrderbyId,
    getOrder_update_all,
    Orderacceptbypartner,
    getlatestOrderbypartner,
    getOrderbypartner,
    PartnerOrderbyweekly,
    PartnerOrderbyday,
    PartnerdaywiseOrder,
    PartnerOrderbyWeek,
    getRoadRouteProxy,
    verifyDelivery,
    createRazorpayPaymentLink,
    getRazorpayPaymentLinkStatus
} = require("../controllers/OrderController");

const router = express.Router();
router.route("/road-route").get(getRoadRouteProxy);
router.route("/new").post(createOrder);
router.route("/verify-delivery").post(verifyDelivery);
router.route("/online-payment-link").post(createRazorpayPaymentLink);
router.route("/online-payment-link/:orderId/status").get(getRazorpayPaymentLinkStatus);
router.route("/order-accept-by-partner").post(Orderacceptbypartner);
router.route("/order-update-all").get(getOrder_update_all);
router.route("/partner-orders/:partnerID").get(getOrderbypartner);
router.route("/latest-partner-orders/:partnerID").get(getlatestOrderbypartner);
router.route("/restaurant-orders/:restauntId").get(getOrderbyRestaurantId);
router.route("/user-orders/:userId").get(getOrderbyUserId);
router.route("/single-orders/:orderId").get(getSingleOrderbyId);
router.route("/partner-weekly-orders-sum/:partnerId").get(PartnerOrderbyweekly);
router.route("/partner-day-orders-sum/:partnerId").get(PartnerOrderbyday);
router.route("/partner-date-orders").post(PartnerdaywiseOrder);
router.route("/partner-week-orders").post(PartnerOrderbyWeek);
router.route("/update").put(UpdateOrder);

module.exports = router;
