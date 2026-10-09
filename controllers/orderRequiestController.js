const Order = require("../models/orderRequiestModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");


exports.getOrder = catchAsyncErrors(async (req, res, next) => {
    try {
        const order = await Order.find({ partnerId: req.params.id });

        res.status(201).json({
            success: true,
            orders: order,
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

exports.OrderDeclineBypartner = catchAsyncErrors(async (req, res, next) => {
    try {
        let order = await Order.findOneAndDelete({ OrderId: req.body.OrderId }, { partnerId: req.body.partnerId });
        if (!order) {
            return res.status(200).json({
                success: false,
                message: "order not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "You have declined this order",
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

exports.UpdateOrder = catchAsyncErrors(async (req, res, next) => {
    try {
        let order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(500).json({
                success: false,
                message: "order not found",
            });
        }
        order = await Order.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });
        res.status(200).json({
            success: true,
            order: order,
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