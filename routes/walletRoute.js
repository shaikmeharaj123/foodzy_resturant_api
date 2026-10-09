const express = require("express");
const {
  createWallet,
  updateWallet,
  getAllWallet,
  bulkUpdateWallet,
  getWalletByClientId
} = require("../controllers/walletController.js");
const router = express.Router();

router.route("/new").post(createWallet);
router.route("/client/:clientId").get(getWalletByClientId);
router.route("/update/:id").put(updateWallet);
router.route("/all").get(getAllWallet);
router.put("/bulk-update", bulkUpdateWallet);

module.exports = router;
