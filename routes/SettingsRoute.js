const express = require("express");
const {
    createSettings,
    gettSettings,
    Settings_update
} = require("../controllers/SettingsController");

const router = express.Router();
router.route("/new").post(createSettings);
router.route("/all").get(gettSettings);
router.route("/update").get(Settings_update);
module.exports = router;
