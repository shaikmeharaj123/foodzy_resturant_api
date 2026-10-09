const express = require("express");
const {
  createSubCategory,
  getAllSubCategory,
  UpdateSubCategory,
  DeleteSubCategory,
  verify_SubCatSlugUrl,
  UploadSubCategoryImage,
  updateAllSubctegory,
  getSubCategorybysuperCategoryUrl,
  subcategorybycatUrl
} = require("../controllers/subCategoryController");

const router = express.Router();
router.route("/new").post(createSubCategory);
router.route("/all").get(getAllSubCategory);
router.route("/super-category/:superCategoryurl").get(getSubCategorybysuperCategoryUrl);
router.route("/category/:categoryUrl").get(subcategorybycatUrl);
router.route("/update-all-sub-ctegory").get(updateAllSubctegory);
router.route("/verify-slugurl/:slugurl").get(verify_SubCatSlugUrl);
router.route("/uploade-images").post(UploadSubCategoryImage);
router.route("/update").put(UpdateSubCategory);
router.route("/delete").delete(DeleteSubCategory);
module.exports = router;
