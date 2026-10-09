const express = require("express");

const {
    UpdateOrder,
    getOrder,
    OrderDeclineBypartner
} = require("../controllers/orderRequiestController");

const router = express.Router();

router.route("/getorder-by-partnerid/:id").get(getOrder);
router.route("/ordercancel-by-partner").post(OrderDeclineBypartner);
router.route("/:id").put(UpdateOrder);

module.exports = router;
