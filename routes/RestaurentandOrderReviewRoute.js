const express = require("express");
const {
    createRestaurentandOrderReview,
    getReviewbyRestaurant,
    getReviewbyProduct,
    getUserReviews,
    getAllReviewsForAdmin,
} = require("../controllers/RestaurentandOrderReviewController");

const router = express.Router();
router.route("/new").post(createRestaurentandOrderReview);
router.route("/user/:userId").get(getUserReviews);
router.route("/admin/all-ratings").get(getAllReviewsForAdmin);
router.route("/all-ratings").get(getAllReviewsForAdmin);
router.route("/restaurent-review/:RestaurentId").get(getReviewbyRestaurant);
router.route("/product-review/:productId").get(getReviewbyProduct);

module.exports = router;
