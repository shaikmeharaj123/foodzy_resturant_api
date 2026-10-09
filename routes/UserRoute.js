const express = require("express");
const {
    createUser,
    send_JWS_token,
    get_protected_user_data,
    mobileExist,
    emailExist,
    Add_Address,
    update_Address,
    delete_Address,
    send_user_notification,
    update_all_user,
    update_user,
    get_all_users,
    update_user_fcm_token,
    generate_random_fcm_token,
} = require("../controllers/UserController");

const router = express.Router();
router.route("/new").post(createUser);
router.route("/send-jsw-token").post(send_JWS_token);
router.route("/get-protected-user-data").post(get_protected_user_data);
router.route("/mobile/:mobile").get(mobileExist);
router.route("/email/:email").get(emailExist);
router.route("/add-address").put(Add_Address);
router.route("/update-address").put(update_Address);
router.route("/delete-address").delete(delete_Address);
router.route("/send-single-notification").post(send_user_notification);
router.route("/update-all").get(update_all_user);
router.route("/update").put(update_user);
router.route("/update-fcm-token").post(update_user_fcm_token);
router.route("/generate-random-fcm-token").post(generate_random_fcm_token);
router.route("/generate-random-fcm-token").get(generate_random_fcm_token);
router.route("/all").get(get_all_users);

module.exports = router;
