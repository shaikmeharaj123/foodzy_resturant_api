const express = require("express");
const {
    createPartnerSchedul,
    getAllPartnerSchedul,
    getbyIdPartnerSchedul,
    UpdatePartnerSchedul
} = require("../controllers/partnerScheduleController");
const router = express.Router();
router.route("/new").post(createPartnerSchedul);
router.route("/all-partner-schedul").get(getAllPartnerSchedul);
router.route("/partner-schedul-byid/:id").get(getbyIdPartnerSchedul);
router.route("/update-partner-schedul/:id").put(UpdatePartnerSchedul);
module.exports = router;