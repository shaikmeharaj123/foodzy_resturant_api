const express = require("express");
const {
    createCoupon,
    getAll_Coupons,
    getAll_Coupons_by_restaurant_id,
    UpdateCoupon,
} = require("../controllers/CouponController");

const router = express.Router();
router.route("/new").post(createCoupon);   
router.route("/all").get(getAll_Coupons);
router.route("/coupons-by-restaurent/:restauntId").get(getAll_Coupons_by_restaurant_id);
router.route("/update").put(UpdateCoupon);

module.exports = router;
