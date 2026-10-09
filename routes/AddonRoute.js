const express = require("express");
const {
    createAddons,
    DeleteAddons,
    getAddonsByRestaurant,
    UpdateAddons
} = require("../controllers/AddonsController");

const router = express.Router();
router.route("/new").post(createAddons);
router.route("/restaurant-addons/:restauntId").get(getAddonsByRestaurant);
router.route("/update").put(UpdateAddons);
router.route("/delete").delete(DeleteAddons);

module.exports = router;
