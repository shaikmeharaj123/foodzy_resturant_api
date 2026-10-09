const express = require("express");
const {
  createSuperCategory,
  getAllSuperCategory,
  UpdateSuperCategory,
  DeleteSuperCategory,
  SlugUrl_Verify,
  getUpdateAllSuperCategory,
} = require("../controllers/superCategoryController");

const router = express.Router();
router.route("/new").post(createSuperCategory);
router.route("/all").get(getAllSuperCategory);
router.route("/updateall").get(getUpdateAllSuperCategory);
router.route("/verify-slugurl/:slugurl").get(SlugUrl_Verify);
router.route("/update").put(UpdateSuperCategory);
router.route("/delete").delete(DeleteSuperCategory);

module.exports = router;
