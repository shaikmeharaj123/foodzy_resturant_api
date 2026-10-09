
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const PartnerSchedul = require("../models/partnerScheduleModel");

exports.createPartnerSchedul = async (req, res, next) => {
    try {
        const partnerSch = await PartnerSchedul.findOne({ partnerId: req.body.partnerId, selectedDates: req.body.selectedDates });
        let partnerSchedul = ""
        if (!partnerSch) {
            partnerSchedul = await PartnerSchedul.create(req.body);

        } else {
            partnerSchedul = await PartnerSchedul.findByIdAndUpdate(partnerSch._id, req.body, {
                new: true,
                useFindAndModify: false,
                runValidators: true,
            });
        }
        res.status(200).json({
            success: true,
            partnerSchedul: partnerSchedul,
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
};
exports.getAllPartnerSchedul = async (req, res, next) => {
    try {
        const partnerSchedul = await PartnerSchedul.find();
        res.status(201).json({
            success: true,
            partnerScheduls: partnerSchedul,
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
};
exports.getbyIdPartnerSchedul = async (req, res, next) => {
    try {
        const partnerSchedul = await PartnerSchedul.find({ partnerId: req.params.id });
        res.status(201).json({
            success: true,
            partnerScheduls: partnerSchedul,
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
};

exports.UpdatePartnerSchedul = catchAsyncErrors(async (req, res, next) => {
    try {
        let partnerSchedul = await PartnerSchedul.findById(req.params.id);
        if (!partnerSchedul) {
            return res.status(200).json({
                success: false,
                message: "partnerSchedul not found",
            });
        }
        partnerSchedul = await PartnerSchedul.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });
        res.status(200).json({
            success: true,
            partnerSchedul: partnerSchedul,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error
        });
    }
});