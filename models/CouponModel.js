const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {

        Restaurentname: {
            type: String,
            required: [true, "Please enter name"],
        },
        restauntId: {
            type: String,
            required: [true, "Please enter name"],
        },
        name: {
            type: String,
            required: [true, "Please enter name"],
        },
        code: {
            type: String,
            required: [true, "Please enter name"],
        },
        minimum_cart_value: {
            type: Number,
            required: [true, "Please enter name"],
        },
        maximum_discount: {
            type: Number,
            required: [true, "Please enter name"],
        },
        discount_percentage: {
            type: Number,
            required: [true, "Please enter name"],
        },
        no_of_avalability: {
            type: Number,
            required: [true, "Please enter name"],
        },
        type: {
            type: String,
            required: [true, "Please enter name"],
        },
        coupon_responce: {
            type: String,
            default:"Restaurent"
        },
        startDate: {
            type: Date,
        },
        expireDate: {
            type: Date,
        },
        status: {
            type: Boolean,
            default: true
        },
        discription: [
            { type: String }
        ],
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
);

module.exports = mongoose.model("Coupon", couponSchema);
