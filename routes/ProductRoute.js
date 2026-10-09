const express = require("express");
const {
    createProduct,
    getProduct,
    DeleteProduct,
    verify_Product_Slugurl,
    Upload_Product_Image,
    UpdateProduct,
    getProductbyRestaurant,
    getProductwithrestaurantAgregate,
    getHomeRestaurantPreview,
    getallProductbySearch_keyword,
    getallProductbySearch_keyword_limit10,
    getProductwithrestaurantAgregate_search_limit,
    getProductwithrestaurantAgregate_by_cat,
    searchProducts,
    getSearchSuggestions
} = require("../controllers/ProductController");

const router = express.Router();
router.route("/new").post(createProduct);
router.route("/all").get(getProduct);
router.route("/search").get(searchProducts);
router.route("/suggestions").get(getSearchSuggestions);
router.route("/search-suggestions").get(getSearchSuggestions);
router.route("/restaurant_with_products").get(getProductwithrestaurantAgregate);
router.route("/home-preview").get(getHomeRestaurantPreview);
router.route("/restaurant-products/:restauntId").get(getProductbyRestaurant);
router.route("/verify-slugurl/:slugUrl").get(verify_Product_Slugurl);
router.route("/product-search/:keywords").get(searchProducts);
router.route("/product-search").get(searchProducts);
router.route("/product-search-limit/:keywords").get(getallProductbySearch_keyword_limit10);
router.route("/restaurent-search-limit/:keywords").get(getProductwithrestaurantAgregate_search_limit);
router.route("/restaurent-search-limit").get(getProductwithrestaurantAgregate_search_limit);
router.route("/restaurent-by-categories/:category").get(getProductwithrestaurantAgregate_by_cat);
router.route("/uploade-images").post(Upload_Product_Image);
router.route("/update").put(UpdateProduct);
router.route("/delete").delete(DeleteProduct);

module.exports = router;
