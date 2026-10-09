const mongoose = require("mongoose");

const partnerScheduleSchema = mongoose.Schema({

    partnerId: {
        type: mongoose.Schema.ObjectId,
        required: [true, "Partner Required"],
        ref: "DeliveryPersion",
    },
    city: {
        type: String,
    },
    selectedDates: {
        type: String,
        required: [true, "Please enter date"],
    },
    WorkingStatus: {
        type: Boolean,
        default: false
    },
    Latitude: {
        type: String,
        required: [true, "user Required"],
    },
    Longitude: {
        type: String,
        required: [true, "user Required"],
    },
    WorkingHours: [
        {
            timing: {
                type: String,
            },
            hours: {
                type: String,
            },
            start_hours: {
                type: String,
            },
            end_hours: {
                type: String,
            },
            workingsatus: {
                type: Boolean,
                default: false,
            },
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("PartnerSchedule", partnerScheduleSchema);
