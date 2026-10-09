const Settings = require("../models/SettingsModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

exports.createSettings = catchAsyncErrors(async (req, res, next) => {
    try {
        const get_settings = await Settings.findOne()
        if (!get_settings) {
            const settings = await Settings.create(req.body);
            if (!settings) {
                return res.status(200).json({
                    success: false,
                    message: "settings not created",
                });
            }
            res.status(201).json({
                success: true,
                settings,
            });
        } else {
            res.status(201).json({
                success: false,
                message: "settings already created",
            });
        }

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
exports.gettSettings = catchAsyncErrors(async (req, res, next) => {
    try {
        const get_settings = await Settings.findOne()
        if (get_settings) {
            res.status(201).json({
                success: true,
                settings: get_settings,
            });
        } else {
            res.status(201).json({
                success: false,
                message: "settings not created",
            });
        }

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
exports.Settings_update = catchAsyncErrors(async (req, res, next) => {
    try {
        let get_settings = await Settings.findOne()
        if (!get_settings) {
            res.status(201).json({
                success: false,
            });
        }
        get_settings = await Settings.findByIdAndUpdate(get_settings._id, req.body, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });

        res.status(201).json({
            success: true,
            settings: get_settings,
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