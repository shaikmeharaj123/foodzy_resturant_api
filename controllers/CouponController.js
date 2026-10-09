const Coupon = require("../models/CouponModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

exports.createCoupon = catchAsyncErrors(async (req, res, next) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({
            success: true,
            coupon,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.getAll_Coupons = catchAsyncErrors(async (req, res, next) => {
    try {
        const coupon = await Coupon.find();
        res.status(201).json({
            success: true,
            coupon: coupon,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.getAll_Coupons_by_restaurant_id = catchAsyncErrors(async (req, res, next) => {
    try {
        const coupon = await Coupon.find({ restauntId: req.params.restauntId });
        res.status(201).json({
            success: true,
            coupon: coupon,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.UpdateCoupon = catchAsyncErrors(async (req, res, next) => {
    try {
        let coupon = await Coupon.findById(req.body.couponId);
        if (!coupon) {
            return res.status(200).json({
                success: false,
                message: "coupon not found",
            });
        }
        coupon = await Coupon.findByIdAndUpdate(req.body.couponId, req.body, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });
        res.status(200).json({
            success: true,
            coupon: coupon,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
