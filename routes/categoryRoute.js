const express = require("express");
const {
  createCategory,
  getAllCategory,
  UpdateCategory,
  DeleteCategory,
  verify_SlugUrl,
  UploadCategoryImage,
  CategorybysupercatUrl,
  updateAllCategory,
  getAllCategory_category,
  getCategoryPage
} = require("../controllers/categoryController");

const router = express.Router();
router.route("/new").post(createCategory);
router.route("/all").get(getAllCategory);
router.route("/active-categories").get(getAllCategory_category);
router.route("/page").get(getCategoryPage);
router.route("/update_all").get(updateAllCategory);
router.route("/verify-slugurl/:slugurl").get(verify_SlugUrl);
router.route("/uploade-images").post(UploadCategoryImage);
router.route("/super-category/:superCategoryurl").get(CategorybysupercatUrl);
router.route("/update").put(UpdateCategory);
router.route("/delete").delete(DeleteCategory);

module.exports = router;
