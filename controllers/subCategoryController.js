const Subcategory = require("../models/subCategoryModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");

exports.createSubCategory = catchAsyncErrors(async (req, res, next) => {
  try {
    const subcategory = await Subcategory.create(req.body);
    res.status(201).json({
      success: true,
      subcategory,
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

exports.getAllSubCategory = catchAsyncErrors(async (req, res) => {
  try {
    const subcategories = await Subcategory.find({ status: true }).sort({
      category: -1,
    });
    res.status(200).json({
      success: true,
      subcategory: subcategories,
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


exports.updateAllSubctegory = catchAsyncErrors(async (req, res) => {
  try {
    let subctegorys = await Subcategory.find();

    for (let index = 0; index < subctegorys.length; index++) {
      let element = subctegorys[index];

      let newSlugUrl = element.category
        .trim()
        .toLowerCase()
        .replace(" ", "-")
        .replace(/[.*+&?^ $@#%^!'{}()|[\]\\]/g, "-")
        .replace("--", "-")
        .replace("---", "-")
        .replace("----", "-")
        .replace("/", "-")
        .replace("//", "-")
        .replace("///", "-");
      newSlugUrl = `${newSlugUrl}-${element.slugUrl}`;
      newSlugUrl = newSlugUrl
        .trim()
        .toLowerCase()
        .replace(" ", "-")
        .replace(/[.*+&?^ $@#%^!'{}()|[\]\\]/g, "-")
        .replace("--", "-")
        .replace("---", "-")
        .replace("----", "-")
        .replace("/", "-")
        .replace("//", "-")
        .replace("///", "-");
      const formData = {
        name: element.name,
        slugUrl: newSlugUrl,
        superCategory: element.superCategory,
        superCategoryId: element.superCategoryId,
        category: element.category,
        categoryId: element.categoryId,
        SubCategory: element.name,
        SubCategoryId: element._id,
        metaTitle: element.name,
        metaKeyword: element.name,
        metaDesc: element.name,
        mobileImage: element.mobileImage,
        desktopImage: element.desktopImage,
      };

      const verifyCategoryTags = await CategoryTags.findOne({
        slugUrl: formData.slugUrl,
      });

      if (!verifyCategoryTags) {
        const subcategory = await CategoryTags.create(formData);
      } else {
        console.log(`${element.name} category tag SlugUrl`);
      }
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

exports.getSubCategorybysuperCategoryUrl = catchAsyncErrors(async (req, res) => {
  try {
    const subcategories = await Subcategory.find({
      superCategoryUrl: req.params.superCategoryurl,
    });
    res.status(200).json({
      success: true,
      subcategory: subcategories,
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

exports.UpdateSubCategory = catchAsyncErrors(async (req, res, next) => {
  try {
    let subcategory = await Subcategory.findById(req.body.subcatId);
    if (!subcategory) {
      return res.status(200).json({
        success: false,
        message: "subcategory not found",
      });
    }
    subcategory = await Subcategory.findByIdAndUpdate(req.body.subcatId, req.body, {
      new: true,
      useFindAndModify: false,
      runValidators: true,
    });
    res.status(200).json({
      success: true,
      subcategory: subcategory,
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

exports.DeleteSubCategory = catchAsyncErrors(async (req, res, next) => {
  try {
    let subcategory = await Subcategory.deleteOne({ _id: req.body.supercatId });
    if (!subcategory) {
      return res.status(200).json({
        success: false,
        message: "subcategory not found",
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

exports.verify_SubCatSlugUrl = catchAsyncErrors(async (req, res, next) => {
  try {
    let subcategory = await Subcategory.findOne({
      slugUrl: req.params.slugurl,
    });

    if (!subcategory) {
      return res.status(200).json({
        success: false,
        message: "new subcategory SlugUrl",
      });
    }

    return res.status(200).json({
      success: true,
      message: " subcategory SlugUrl already exist",
      subcategory: subcategory,
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

exports.UploadSubCategoryImage = catchAsyncErrors(async (req, res, next) => {
  try {
    const desktopImage = await cloudinary.v2.uploader.upload(
      req.body.desktopImage,
      {
        folder: "SubCategory/DesktopImage",
        format: "webp"
      }
    );
    const desktopImages = desktopImage.secure_url;
    const mobileimage = await cloudinary.v2.uploader.upload(
      req.body.desktopImage,
      {
        folder: "SubCategory/MobileImage",
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

exports.subcategorybycatUrl = catchAsyncErrors(async (req, res, next) => {
  try {
    let subcategories = await Subcategory.find({ categoryUrl: req.params.categoryUrl });
    if (!subcategories) {
      return res.status(200).json({
        success: false,
        message: "subcategory not found",
      });
    }
    res.status(200).json({
      success: true,
      subcategory: subcategories,
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

