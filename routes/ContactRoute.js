const express = require("express");
const router = express.Router();
const {
    createContactInquiry,
    getAllContactInquiries,
    getContactInquiryById,
    updateContactStatus,
    deleteContactInquiry,
} = require("../controllers/ContactController");

router.route("/create").post(createContactInquiry);
router.route("/all").get(getAllContactInquiries);
router.route("/:id/status").put(updateContactStatus);
router.route("/update/:id").put(updateContactStatus);
router.route("/:id").get(getContactInquiryById).delete(deleteContactInquiry).put(updateContactStatus);

module.exports = router;
