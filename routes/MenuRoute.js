const express = require("express");
const {
  listMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuImage,
} = require("../controllers/MenuController");

const router = express.Router();

router.get("/all", listMenuItems);
router.post("/new", createMenuItem);
router.post("/upload-image", uploadMenuImage);
router.get("/:id", getMenuItem);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);

module.exports = router;
