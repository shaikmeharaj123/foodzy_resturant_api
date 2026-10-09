const mongoose = require("mongoose");

const OrderRequiestSchema = mongoose.Schema({
    OrderId: {
        type: mongoose.Schema.ObjectId,
        ref: "Order",
        required: true,
    },
    partnerId: {
        type: mongoose.Schema.ObjectId,
        ref: "Partner",
        required: true,
    },
    delivery_partnerCharge: {
        type: Number,
        required: true,
        default: 0,
    },
    surgeAmount: {
        type: Number,
        default: 0,
    },
    Username: {
        type: String,
        required: [true, "Please Enter User Name"],
        trim: true,
    },
    userLatitude: {
        type: String,
        required: [true, "restaunt Required"],
    },
    userLongitude: {
        type: String,
        required: [true, "restaunt Required"],
    },
    restauntName: {
        type: String,
        required: [true, "restaunt Required"],
    },
    restauntLatitude: {
        type: String,
        required: [true, "restaunt Required"],
    },
    restauntLongitude: {
        type: String,
        required: [true, "restaunt Required"],
    },
    distance: {
        type: String,
        required: [true, "restaunt Required"],
    },
    time: {
        type: String,
        required: [true, "restaunt Required"],
    },
    cancel_reason: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("OrderRequiest", OrderRequiestSchema);
