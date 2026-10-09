const mongoose = require("mongoose");

const restaurentandOrderReview = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            required: [true, "userId Required"],
            ref: "User",
        },
        Username: {
            type: String,
            required: [true, "Please Enter User Name"],
            trim: true,
        },
        RestaurentId: {
            type: mongoose.Schema.ObjectId,
            required: [true, "RestaurentId Required"],
            ref: "Restaurant",
        },
        productIds: [
            {
                productId: {
                    type: mongoose.Schema.ObjectId,
                    required: [true, "productId Required"],
                    ref: "Product",
                },
                name: {
                    type: String,
                    required: [true, "Please enter name"],
                    trim: true,
                },

            },
        ],
        OrderId: {
            type: mongoose.Schema.ObjectId,
            required: [true, "OrderId Required"],
            ref: "Order",
        },
        comment: {
            type: String,
            default: ""
        },
        rating: {
            type: Number,
            default: 5,
        },
        restaurantRating: {
            type: Number,
            default: 5,
        },
        restaurantComment: {
            type: String,
            default: "",
        },
        restaurantCompliments: [
            {
                type: String,
            },
        ],
        DeliveryPersionId: {
            type: mongoose.Schema.ObjectId,
            ref: "DeliveryPersion",
            default: null,
        },
        DeliveryPersionName: {
            type: String,
            default: "",
        },
        riderRating: {
            type: Number,
            default: 5,
        },
        riderComment: {
            type: String,
            default: "",
        },
        riderCompliments: [
            {
                type: String,
            },
        ],
        restauntName: {
            type: String,
            default: "",
        },
        orderTotal: {
            type: Number,
            default: 0,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    // { timestamps: true }
);

module.exports = mongoose.model("RestaurentandOrderReview", restaurentandOrderReview);
