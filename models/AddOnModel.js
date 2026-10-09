const mongoose = require("mongoose");
const validator = require("validator");

const addonsSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter name"],
            trim: true,
        },
        restauntId: {
            type: mongoose.Schema.ObjectId,
            required: [true, "restauntId Required"],
            ref: "Restaurant",
        },
        addons: [
            {
                productId: {
                    type: mongoose.Schema.ObjectId,
                    required: [true, "productId Required"],
                    ref: "Product",
                },
                packSizeName: {
                    type: String,
                    required: [true, "Please enter packSizeName"],
                },
                Price: {
                    type: Number,
                    required: [true, "Please enter Price"],
                },
                status: {
                    type: Boolean,
                    default: true,
                },
            },
        ],

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
);

module.exports = mongoose.model("Addons", addonsSchema);
