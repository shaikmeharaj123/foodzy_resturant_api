const express = require("express");
const {
    createRestaurant,
    getRestaurant,
    UpdateRestaurant,
    DeleteRestaurant,
    verify_Restaurant_Number,
    verify_Restaurant_Email,
    verify_Restaurant_GST,
    verify_Restaurant_FSSAI_Lic_No,
    Upload_Restaurant_Image,
    send_JWS_token,
    get_protected_restaurant_data,
    Add_menu,
    update_menu,
    updating_restaurant_data_jws,
    getallRestaurentbySearch_keyword_limit10,
    getRestaurantbycategory,
    Update_all_Restaurant,
    getDiningRestaurants,
    getPickupRestaurants,
    bookDiningTable
} = require("../controllers/RestaurantController");

const router = express.Router();
router.route("/new").post(createRestaurant);
router.route("/all").get(getRestaurant);
router.route("/dining/all").get(getDiningRestaurants);
router.route("/pickup/all").get(getPickupRestaurants);
router.route("/dining/book-table").post(bookDiningTable);
router.route("/update-all").get(Update_all_Restaurant);
router.route("/send-jsw-token").post(send_JWS_token);
router.route("/get-protected-restaurant-data").post(get_protected_restaurant_data);
router.route("/verify-mobile/:mobile").get(verify_Restaurant_Number);
router.route("/verify-email/:email").get(verify_Restaurant_Email);
router.route("/verify-gst/:GST").get(verify_Restaurant_GST);
router.route("/verify-fssai-lic-no/:FSSAI_Lic_No").get(verify_Restaurant_FSSAI_Lic_No);
router.route("/restaurant-reasrch/:keywords").get(getallRestaurentbySearch_keyword_limit10);
router.route("/restaurant-reasrch-category/:category").get(getRestaurantbycategory);
router.route("/uploade-images").post(Upload_Restaurant_Image);
router.route("/update").put(UpdateRestaurant);
router.route("/delete").delete(DeleteRestaurant);
router.route("/menu-add").put(Add_menu);
router.route("/menu-update").put(update_menu);
router.route("/update-restaurant-jwt").put(updating_restaurant_data_jws);

module.exports = router;
