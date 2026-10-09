const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        trim: true,
        lowercase: true,
    },
    issue: {
        type: String,
        required: [true, "Please enter your issue or message"],
    },
    userId: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    status: {
        type: String,
        enum: ["Pending", "In Progress", "Resolved"],
        default: "Pending",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Contact", contactSchema);
