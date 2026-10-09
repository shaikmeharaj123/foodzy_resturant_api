const Category = require("../models/categoryModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");


exports.createCategory = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.body.name) {
      res.status(201).json({
        success: false,
        message: "Please fill the Category Name ",
      });
    } else {
      let category = await Category.findOne({
        slugUrl: req.body.slugUrl,
      });
      if (category) {
        res.status(201).json({
          success: false,
          category: category,
          message: "Category Already Exist",
        });
      } else {
        category = await Category.create(req.body);
        res.status(201).json({
          success: true,
          category: category,
        });
      }
    }
  } catch (error) {
    res.status(201).json({
      success: false,
      message: "Error Occurred: " + error.message,
    });
  }
});

exports.getAllCategory = catchAsyncErrors(async (req, res) => {
  try {
    let categories = await Category.find();
    res.status(201).json({
      success: true,
      category: categories,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(400).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(500).json({
      success: false,
      massage: error._message,
      error: error,
    });
  }
});
exports.getAllCategory_category = catchAsyncErrors(async (req, res) => {
  try {
    let categories = await Category.find({ status: true });
    res.status(201).json({
      success: true,
      length: categories.length,
      category: categories,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(400).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(500).json({
      success: false,
      massage: error._message,
      error: error,
    });
  }
});

exports.getCategoryPage = catchAsyncErrors(async (req, res) => {
  const pageSize = Math.min(Number(req.query.pageSize) || 10, 20);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const filter = {status: true};
  const [category, countResult] = await Promise.all([
    Category.find(filter)
      .sort({createdAt: 1})
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Category.countDocuments(filter),
  ]);
  const count = countResult;

  res.status(200).json({
    success: true,
    category,
    count,
    page,
    pageSize,
    hasMore: page * pageSize < count,
  });
});

exports.updateAllCategory = catchAsyncErrors(async (req, res) => {
  try {
    let category = await Category.find();

    for (let index = 0; index < category.length; index++) {
      let cat_element = category[index];

      cat_element = await Category.findByIdAndUpdate(
        cat_element._id,
        { status: false },
        {
          new: true,
          useFindAndModify: false,
          runValidators: true,
        }
      );
    }
    res.status(200).json({
      success: true,
      categoryCount: category.length,
      category: category,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(400).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(500).json({
      success: false,
      massage: error._message,
      error: error,
    });
  }
});

exports.UpdateCategory = catchAsyncErrors(async (req, res, next) => {
  try {
    let category = await Category.findById(req.body.categoryId);
    if (!category) {
      return res.status(201).json({
        success: false,
        message: "category not found",
      });
    }
    category = await Category.findByIdAndUpdate(req.body.categoryId, req.body, {
      new: true,
      useFindAndModify: false,
      runValidators: true,
    });
    res.status(200).json({
      success: true,
      category: category,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(400).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(500).json({
      success: false,
      massage: error._message,
      error: error,
    });
  }
});

exports.DeleteCategory = catchAsyncErrors(async (req, res, next) => {
  try {
    let category = await Category.deleteOne({ _id: req.body.categoryId });
    if (!category) {
      return res.status(200).json({
        success: false,
        message: "category not found",
      });
    }
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(400).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(500).json({
      success: false,
      massage: error._message,
      error: error,
    });
  }
});

exports.verify_SlugUrl = catchAsyncErrors(async (req, res, next) => {
  try {
    let category = await Category.findOne({ slugUrl: req.params.slugurl });

    if (!category) {
      return res.status(200).json({
        success: false,
        message: "new category SlugUrl",
      });
    }
    return res.status(200).json({
      success: true,
      message: " category SlugUrl already exist",
      category: category,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(400).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(500).json({
      success: false,
      massage: error._message,
      error: error,
    });
  }
});

exports.UploadCategoryImage = catchAsyncErrors(async (req, res, next) => {
  try {
    const desktopImage = await cloudinary.v2.uploader.upload(
      req.body.desktopImage,
      {
        folder: "Category/DesktopImage",
        format: "webp"
      }
    );
    const desktopImages = desktopImage.secure_url;
    const mobileimage = await cloudinary.v2.uploader.upload(
      req.body.desktopImage,
      {
        folder: "Category/MobileImage",
        format: "webp"
      }
    );
    const mobileimages = mobileimage.secure_url;
    res.status(200).json({
      success: true,
      desktopImages,
      mobileimages,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(400).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(500).json({
      success: false,
      massage: error._message,
      error: error,
    });
  }
});

exports.CategorybysupercatUrl = catchAsyncErrors(async (req, res, next) => {
  try {
    let categories = await Category.find({
      superCategoryUrl: req.params.superCategoryurl,
    });
    if (!categories) {
      return res.status(200).json({
        success: false,
        message: "category not found",
      });
    }
    res.status(200).json({
      success: true,
      category: categories,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(400).json({
      success: false,
      massage: error._message,
      error: error,
    });
    res.status(500).json({
      success: false,
      massage: error._message,
      error: error,
    });
  }
});
