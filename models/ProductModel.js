const mongoose = require("mongoose");
const validator = require("validator");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter name"],
    trim: true,
  },
  slugUrl: {
    type: String,
    required: [true, "Please provide slugurl"],
    unique: [true, "slugUrl already exist"],
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },

  restauntId: {
    type: mongoose.Schema.ObjectId,
    required: [true, "restauntId Required"],
    ref: "Restaurant",
  },
  restaunt: {
    type: String,
    required: [true, "restaunt Required"],
  },

  category: {
    type: String,
    required: [true, "Please enter Category Name name"],
  },
  categoryUrl: {
    type: String,
    required: [true, "Please enter categoryUrl"],
  },

  // subcategory: {
  //     type: String,
  //     required: [true, "Please enter Sub Category Name name"],
  // },
  // subcategoryUrl: {
  //     type: String,
  //     required: [true, "Please enter subcategoryUrl"],
  // },

  veg: {
    type: Boolean,
    default: false,
  },
  Nonveg: {
    type: Boolean,
    default: false,
  },
  menu_types: [
    {
      type: String,
      required: [true, "Please enter type"],
    },
  ],
  status: {
    type: Boolean,
    default: true,
  },
  OutOfStack: {
    type: Boolean,
    default: false,
  },
  thumbnail: {
    type: String,
    required: [true, "Please enter thumbnail"],
  },
  searchkeywords: {
    type: String,
    default: "",
  },
  keywords: {
    type: String,
    default: "",
  },
  // slider: [
  //     {
  //         type: String,
  //         required: [true, "Please enter image"],
  //     }
  // ],
  rating: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },

  trending: {
    type: Boolean,
    default: false,
  },
  recommendation: {
    type: Boolean,
    default: false,
  },
  packSize: [
    {
      packSizeName: {
        type: String,
        required: [true, "Please enter packSizeName"],
      },
      Price: {
        type: Number,
        required: [true, "Please enter Price"],
      },
      Prime: {
        type: Boolean,
        default: false,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.index({ restauntId: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
