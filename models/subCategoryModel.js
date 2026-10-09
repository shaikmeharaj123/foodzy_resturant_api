const mongoose = require("mongoose");

const subCategorySchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter Sub Category name"],
    trim: true,
  },
  slugUrl: {
    type: String,
    required: [true, "Please provide slugurl"],
    unique: [true, "slugUrl already exist"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Please enter Category Name name"],
  },
  categoryUrl: {
    type: String,
    required: [true, "Please enter categoryUrl"],
  },
  Banners: [
    {
      banner: {
        type: String,
        default: ""
      },
      show: {
        type: Boolean,
        default: false
      },
    }
  ],
  metaTitle: {
    type: String,
    default: "",
    trim: true,
  },
  metaKeyword: {
    type: String,
    default: "",
    trim: true,
  },
  metaDesc: {
    type: String,
    default: "",
    trim: true,
  },
  mobileImage: {
    type: String,
    required: [true, "Please provide mobileImage"],
  },

  desktopImage: {
    type: String,
    required: [true, "Please provide desktopImage"],
  },
  status: {
    type: Boolean,
    default: true,
  },
  veg: {
    type: Boolean,
    default: false,
  },
  Nonveg: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    default: "22",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Subcategory", subCategorySchema);
