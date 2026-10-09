const mongoose = require("mongoose");
const validator = require("validator");

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please Enter Name"],
            trim: true,
        },
        mobile: {
            type: Number,
            unique: [true, "mobile already exist"],
            minlength: [10, "mobile should be 10 characters"],
            maxlength: [10, "mobile should be 10 characters"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Please Provide Email"],
            unique: [true, "email already exist"],
            validate: [validator.isEmail, "Please Enter a Valid Email"],
        },
        Delivery_type: {
            type: String,
            default: "Delivery"
        },
        delivery_Commission: {
            type: String,
        },
        pickup_Commission: {
            type: String,
        },
        GST: {
            type: String,
            // unique: [true, "legalname already exist"],
        },
        FSSAI_Lic_No: {
            type: String,
            sparse: true,
        },
        logo: {
            type: String,
            default: ""
        },
        gst_percentage: {
            type: Number,
            default: 12.5
        },
        contact_number: {
            type: String,
        },
        Latitude: {
            type: String,
        },
        Longitude: {
            type: String,
        },
        Branch: {
            type: String,
        },
        address: {
            type: String,
        },
        revenue: {
            type: Number,
            default: 0
        },
        bankName: {
            type: String,
            default: ""
        },
        accountNumber: {
            type: String,
            default: ""
        },
        ifscCode: {
            type: String,
            default: ""
        },
        upiId: {
            type: String,
            default: ""
        },
        open_status: {
            type: Boolean,
            default: true
        },
        status: {
            type: Boolean,
            default: false
        },
        categories: [
            {
                type: String
            }
        ],
        menu: [
            {
                category: {
                    type: String
                },
                categoryurl: {
                    type: String
                },
                name: {
                    type: String
                },
                status: {
                    type: Boolean,
                    default: true
                },
            }
        ],
        preparationTiming: {
            type: String,
            default: "15"
        },
        minDeliveryTiming: {
            type: String,
            default: "15"
        },
        maxDeliveryTiming: {
            type: String,
            default: "45"
        },
        open_timings: [
            {
                day: {
                    type: String,
                    default: ""
                },
                startTime: {
                    type: String,
                    default: ""
                },
                startTimeFormate: {
                    type: String,
                    default: ""
                },
                endTime: {
                    type: String,
                    default: ""
                },
                endTimeFormate: {
                    type: String,
                    default: ""
                },
                staus: {
                    type: Boolean,
                    default: true
                },
            }
        ],
        rating: {
            type: Number,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },
        is_dining_available: {
            type: Boolean,
            default: true,
        },
        is_pickup_available: {
            type: Boolean,
            default: true,
        },
        dining_discount: {
            type: String,
            default: "Up to 30% OFF on Dine-in",
        },
        dining_timings: {
            type: String,
            default: "11:00 AM - 11:30 PM",
        },
        dining_features: [
            {
                type: String,
            }
        ],
        table_booking_enabled: {
            type: Boolean,
            default: true,
        },
        pickup_time: {
            type: String,
            default: "15-20 mins",
        },
        pickup_discount: {
            type: String,
            default: "Save 10% Extra on Pickup",
        },
        cost_for_two: {
            type: String,
            default: "₹600 for two",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    // { timestamps: true }
);

restaurantSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Restaurant", restaurantSchema);
