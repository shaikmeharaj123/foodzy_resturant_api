const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const MongoStore = require('connect-mongo');
const session = require('express-session');
const errorMiddleware = require("./middleware/error");

if (process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config({ path: "config/config.env" });
}
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, parameterLimit: 500000, limit: '50mb' }))
app.use(cookieParser());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.DB_URI,
        collectionName: 'sessions',
        ttl: 5 * 24 * 60 * 60
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

//Route Imports
const sendotp = require("./routes/OtpRoute");
app.use("/api/v1/sendotp", sendotp);

const doctor = require("./routes/DoctorRoutes");
app.use("/api/v1/doctor", doctor);

const admin = require("./routes/AdminRoutes");
app.use("/api/v1/admin", admin);

const user = require("./routes/UserRoute");
app.use("/api/v1/user", user);

const supercategory = require("./routes/superCategoryRoute");
app.use("/api/v1/supercategory", supercategory);

const category = require("./routes/categoryRoute");
app.use("/api/v1/category", category);

const subcategory = require("./routes/subCategoryRoute");
app.use("/api/v1/subcategory", subcategory);

const restaurant = require("./routes/RestaurantRoute");
app.use("/api/v1/restaurant", restaurant);

const addons = require("./routes/AddonRoute");
app.use("/api/v1/addons", addons);

const product = require("./routes/ProductRoute");
app.use("/api/v1/product", product);

const order = require("./routes/OrderRoutes");
app.use("/api/v1/order", order);

const deliverypartner = require("./routes/DeliveryPersonRoute");
app.use("/api/v1/deliverypartner", deliverypartner);

const partnerschedule = require("./routes/partnerScheduleRoute");
app.use("/api/v1/partnerschedule", partnerschedule);

const orderrequiest = require("./routes/orderRequiestRoute");
app.use("/api/v1/orderrequiest", orderrequiest);

const coupon = require("./routes/CouponRoutes");
app.use("/api/v1/coupon", coupon);

const wallet = require("./routes/walletRoute.js");
app.use("/api/v1/wallet", wallet);

const restaurentreview = require("./routes/RestaurentandOrderReviewRoute");
app.use("/api/v1/restaurentreview", restaurentreview);

const settings = require("./routes/SettingsRoute");
app.use("/api/v1/settings", settings);

const contact = require("./routes/ContactRoute");
app.use("/api/v1/contact", contact);
app.use("/api/v1/admin/contact", contact);

const deliveryConfig = require("./routes/deliveryConfigRoutes");
app.use("/api/v1/delivery-config", deliveryConfig);

// Middleware for Errors
app.use(errorMiddleware);

module.exports = app;
