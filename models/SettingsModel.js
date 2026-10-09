const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
    {
        platform_fee: {
            type: Number,
            default: 1
        },
        rain_status: {
            type: Boolean,
            default: false
        },
        night_time: {
            type: String,
            default: "22:30"
        },

        distance: [
            {
                base_delivery_price: {
                    type: Number,
                    default: 50
                },
                base_rain_fee: {
                    type: Number,
                    default: 20
                },
                base_late_fee: {
                    type: Number,
                    default: 15
                },
                distance_min: {
                    type: Number,
                    default: 1
                },
                distance_max: {
                    type: Number,
                    default: 3
                },
            },
            {
                base_delivery_price: {
                    type: Number,
                    default: 6
                },
                base_rain_fee: {
                    type: Number,
                    default: 2
                },
                base_late_fee: {
                    type: Number,
                    default: 1
                },
                distance_min: {
                    type: Number,
                    default: 4
                },
                distance_max: {
                    type: Number,
                    default: 6
                },
            },
            {
                base_delivery_price: {
                    type: Number,
                    default: 8
                },
                base_rain_fee: {
                    type: Number,
                    default: 2
                },
                base_late_fee: {
                    type: Number,
                    default: 1.5
                },
                distance_min: {
                    type: Number,
                    default: 7
                },
                distance_max: {
                    type: Number,
                    default: 10
                },
            },
            {
                base_delivery_price: {
                    type: Number,
                    default: 9
                },
                base_rain_fee: {
                    type: Number,
                    default: 2
                },
                base_late_fee: {
                    type: Number,
                    default: 1.5
                },
                distance_min: {
                    type: Number,
                    default: 10
                },
                distance_max: {
                    type: Number,
                    default: 50
                },
            }
        ],
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
);

module.exports = mongoose.model("Settings", settingsSchema);
