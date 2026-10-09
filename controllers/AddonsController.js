const Addons = require("../models/AddOnModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");

exports.createAddons = catchAsyncErrors(async (req, res, next) => {
    try {
        let data = []
        for (let index = 0; index < req.body.addons.length; index++) {
            let element = req.body.addons[index];
            let find_addons = await Addons.findOne({ $and: [{ restauntId: element.restauntId }, { name: element.name }] })

            if (find_addons) {
                let formdata = {
                    productId: element.productId,
                    packSizeName: element.packSizeName,
                    Price: element.Price,
                    status: element.status,
                }
                find_addons.addons = [...find_addons.addons, formdata]
                find_addons = await Addons.findByIdAndUpdate(find_addons._id, find_addons, {
                    new: true,
                    useFindAndModify: false,
                    runValidators: true,
                });
                data = [...data, find_addons]
            } else {
                const formData = {
                    name: element.name,
                    restauntId: element.restauntId,
                    addons: [
                        {
                            productId: element.productId,
                            packSizeName: element.packSizeName,
                            Price: element.Price,
                            status: element.status,
                        }
                    ]
                }

                const addons = await Addons.create(formData);
                data = [...data, addons]
            }
        }
        res.status(201).json({
            success: true,
            addons: data,
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

exports.getAddonsByRestaurant = catchAsyncErrors(async (req, res, next) => {
    try {
        const addons = await Addons.find({ restauntId: req.params.restauntId });
        res.status(201).json({
            success: true,
            addons: addons,
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

exports.UpdateAddons = catchAsyncErrors(async (req, res, next) => {
    try {
        let addons = await Addons.findById(req.body.addonsId);
        if (!addons) {
            return res.status(200).json({
                success: false,
                message: "addons not found",
            });
        }
        addons = await Addons.findByIdAndUpdate(req.body.addonsId, req.body, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });
        res.status(200).json({
            success: true,
            addons: addons,
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

exports.DeleteAddons = catchAsyncErrors(async (req, res, next) => {
    try {
        let addons = await Addons.deleteOne({ _id: req.body.addonsId });
        if (!addons) {
            return res.status(200).json({
                success: false,
                message: "addons not found",
            });
        }
        res.status(200).json({
            success: true,
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