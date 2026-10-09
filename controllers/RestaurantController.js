const Restaurant = require("../models/RestaurantModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");
const jwt = require('jsonwebtoken');
const { withTimingMeta } = require("../utils/restaurantTiming");


exports.createRestaurant = catchAsyncErrors(async (req, res, next) => {
    try {
        const restaurant = await Restaurant.create(req.body);
        res.status(201).json({
            success: true,
            restaurant,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.getallRestaurentbySearch_keyword_limit10 = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.find({
            name: { $regex: `.*${req.params.keywords}*.`, $options: "i" },
        }).limit(10);
        res.status(201).json({
            success: true,
            restaurants: restaurant,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
};
exports.getRestaurant = catchAsyncErrors(async (req, res, next) => {
    try {
        const latitude = Number(req.query.latitude);
        const longitude = Number(req.query.longitude);
        const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 5, 0), 50);
        const hasLocation =
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            Math.abs(latitude) <= 90 &&
            Math.abs(longitude) <= 180;
        const allRestaurants = await Restaurant.find().lean();
        const restaurants = hasLocation
            ? allRestaurants
                .map(restaurant => {
                    const restaurantLatitude = Number(restaurant.Latitude);
                    const restaurantLongitude = Number(restaurant.Longitude);

                    if (!Number.isFinite(restaurantLatitude) || !Number.isFinite(restaurantLongitude)) {
                        return null;
                    }

                    const radians = degrees => (degrees * Math.PI) / 180;
                    const latitudeDelta = radians(restaurantLatitude - latitude);
                    const longitudeDelta = radians(restaurantLongitude - longitude);
                    const haversine =
                        Math.sin(latitudeDelta / 2) ** 2 +
                        Math.cos(radians(latitude)) *
                            Math.cos(radians(restaurantLatitude)) *
                            Math.sin(longitudeDelta / 2) ** 2;
                    const distanceKm =
                        6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

                    return distanceKm <= radiusKm
                        ? { ...restaurant, distanceKm }
                        : null;
                })
                .filter(Boolean)
                .sort((a, b) => a.distanceKm - b.distanceKm)
            : allRestaurants;
        const decoratedRestaurants = restaurants.map(restaurant => withTimingMeta(restaurant));

        return res.status(200).json({
            success: true,
            restaurant: decoratedRestaurants,
            restaurants: decoratedRestaurants,
            count: decoratedRestaurants.length,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.getRestaurantbycategory = catchAsyncErrors(async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find({ categories: { $in: [req.params.category] } });
        res.status(201).json({
            success: true,
            restaurant: restaurants,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.UpdateRestaurant = catchAsyncErrors(async (req, res, next) => {
    try {
        let restaurant = await Restaurant.findById(req.body.restaurantId);
        if (!restaurant) {
            return res.status(200).json({
                success: false,
                message: "restaurant not found",
            });
        }
        restaurant = await Restaurant.findByIdAndUpdate(req.body.restaurantId, req.body, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });
        res.status(200).json({
            success: true,
            restaurant: restaurant,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.Update_all_Restaurant = catchAsyncErrors(async (req, res, next) => {
    try {
        const restaurant = await Restaurant.find();

        for (let index = 0; index < restaurant.length; index++) {
            let element = restaurant[index];

            const formdata = {
                Branch: "Samajiguda",
            }

            element = await Restaurant.findByIdAndUpdate(element._id, formdata, {
                new: true,
                useFindAndModify: false,
                runValidators: true,
            });

        }


        res.status(200).json({
            success: true,
            restaurant: restaurant,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.DeleteRestaurant = catchAsyncErrors(async (req, res, next) => {
    try {
        let restaurant = await Restaurant.deleteOne({ _id: req.body.restaurantId });
        if (!restaurant) {
            return res.status(200).json({
                success: false,
                message: "restaurant not found",
            });
        }
        res.status(200).json({
            success: true,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.verify_Restaurant_Number = catchAsyncErrors(async (req, res, next) => {
    try {
        let restaurant = await Restaurant.findOne({
            mobile: req.params.mobile,
        });

        if (!restaurant) {
            return res.status(200).json({
                success: false,
                message: "new restaurant mobile",
            });
        }

        return res.status(200).json({
            success: true,
            message: " restaurant mobile already exist",
            restaurant: restaurant,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.verify_Restaurant_Email = catchAsyncErrors(async (req, res, next) => {
    try {
        let restaurant = await Restaurant.findOne({
            email: req.params.email,
        });

        if (!restaurant) {
            return res.status(200).json({
                success: false,
                message: "new restaurant email",
            });
        }

        return res.status(200).json({
            success: true,
            message: " restaurant email already exist",
            restaurant: restaurant,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.verify_Restaurant_GST = catchAsyncErrors(async (req, res, next) => {
    try {
        let restaurant = await Restaurant.findOne({
            GST: req.params.GST,
        });

        if (!restaurant) {
            return res.status(200).json({
                success: false,
                message: "new restaurant GST",
            });
        }

        return res.status(200).json({
            success: true,
            message: " restaurant GST already exist",
            restaurant: restaurant,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.verify_Restaurant_FSSAI_Lic_No = catchAsyncErrors(async (req, res, next) => {
    try {
        let restaurant = await Restaurant.findOne({
            FSSAI_Lic_No: req.params.FSSAI_Lic_No,
        });

        if (!restaurant) {
            return res.status(200).json({
                success: false,
                message: "new restaurant FSSAI Lic No",
            });
        }

        return res.status(200).json({
            success: true,
            message: " restaurant FSSAI Lic No already exist",
            restaurant: restaurant,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});
exports.Upload_Restaurant_Image = catchAsyncErrors(async (req, res, next) => {
    try {
        const logo = await cloudinary.v2.uploader.upload(
            req.body.logo,
            {
                folder: "Restaurant/Logo",
                format: "webp"
            }
        );
        const logos = logo.secure_url;
        res.status(200).json({
            success: true,
            logo: logos,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});

exports.send_JWS_token = catchAsyncErrors(async (req, res, next) => {
    try {
        const mobile = req.body.mobile;

        if (!mobile) {
            res.status(201).json({
                success: false,
                massage: "Invalid mobile"
            });
        }
        const restaurant = await Restaurant.findOne({ mobile: mobile });
        if (!restaurant) {
            res.status(201).json({
                success: false,
                massage: "restaurant not found"
            });
        } else {
            const SECRET_KEY = process.env.SECRET_KEY
            const token = jwt.sign({ mobile }, SECRET_KEY, { expiresIn: '1m' });
            res.status(201).json({
                success: true,
                token: `Basic ${token}`,
            });
        }
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error
        });
    }
});

exports.get_protected_restaurant_data = catchAsyncErrors(async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).send('Authorization header missing');
        }
        const [scheme, credentials] = authHeader.split(' ');
        if (scheme !== 'Basic') {
            res.status(201).json({
                success: false,
                massage: "Unsupported authorization scheme"
            });
        }

        jwt.verify(credentials, process.env.SECRET_KEY, async (err, decoded) => {
            if (err) {
                res.status(201).json({
                    success: false,
                    massage: "Invalid token"
                });
            } else {
                const data = decoded
                const experire_date = new Date(data.exp * 1000)
                const current_date = new Date()
                if (experire_date > current_date) {
                    if (
                        data.mobile
                    ) {
                        const restaurant = await Restaurant.findOne({ mobile: data.mobile });
                        if (!restaurant) {
                            res.status(201).json({
                                success: false,
                                massage: "restaurant not found"
                            });
                        }
                        const SECRET_KEY = process.env.SECRET_KEY
                        const token = jwt.sign({ restaurant }, SECRET_KEY, { expiresIn: '5m' });
                        next();
                        res.status(201).json({
                            success: true,
                            restaurant: restaurant,
                            token: token,
                            massage: "Authorized"
                        });
                    } else {
                        res.status(401).json({
                            success: false,
                            massage: "Unauthorized"
                        });
                    }
                } else {
                    res.status(401).json({
                        success: false,
                        massage: "Token has expired"
                    });
                }
            }
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            message: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            message: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            message: error._message,
            error: error,
        });
    }
});

exports.updating_restaurant_data_jws = catchAsyncErrors(async (req, res, next) => {
    try {
        let restaurant = await Restaurant.findById(req.body.restaurantId);
        if (!restaurant) {
            return res.status(200).json({
                success: false,
                message: "restaurant not found",
            });
        }
        restaurant = await Restaurant.findByIdAndUpdate(req.body.restaurantId, req.body, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });
        const SECRET_KEY = process.env.SECRET_KEY
        const token = jwt.sign({ restaurant }, SECRET_KEY, { expiresIn: '5m' });
        res.status(200).json({
            success: true,
            token: token,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            message: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            message: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            message: error._message,
            error: error,
        });
    }
});

exports.Add_menu = catchAsyncErrors(async (req, res, next) => {
    try {
        let restaurant = await Restaurant.findById(req.body.RestaurentId);
        if (!restaurant) {
            res.status(201).json({
                success: false,
            });
        }
        restaurant.menu = [...restaurant.menu, req.body]
        restaurant = await Restaurant.findByIdAndUpdate(req.body.RestaurentId, restaurant, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });
        res.status(201).json({
            success: true,
            restaurant: restaurant
        });

    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});

exports.update_menu = catchAsyncErrors(async (req, res, next) => {
    try {
        let restaurant = await Restaurant.findById(req.body.RestaurentId);
        if (!restaurant) {
            res.status(201).json({
                success: false,
            });
        }
        restaurant.menu = restaurant.menu.map((data) => {
            if (String(data._id) === String(req.body.menuId)) {
                const formdata = {
                    category: req.body.category,
                    categoryurl: req.body.categoryurl,
                    name: req.body.name,
                    _id: req.body.menuId
                }
                data = formdata
            }
            return data
        })
        restaurant.menu = restaurant.menu
        restaurant = await Restaurant.findByIdAndUpdate(req.body.RestaurentId, restaurant, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });
        res.status(201).json({
            success: true,
            restaurant: restaurant
        });

    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});

exports.getDiningRestaurants = catchAsyncErrors(async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find({
            $or: [
                { is_dining_available: true },
                { is_dining_available: { $exists: false } }
            ]
        });
        res.status(200).json({
            success: true,
            restaurants,
            count: restaurants.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error,
        });
    }
});

exports.getPickupRestaurants = catchAsyncErrors(async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find({
            $or: [
                { is_pickup_available: true },
                { is_pickup_available: { $exists: false } }
            ]
        });
        res.status(200).json({
            success: true,
            restaurants,
            count: restaurants.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error,
        });
    }
});

exports.bookDiningTable = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            restaurantId,
            restaurantName,
            userName,
            userPhone,
            date,
            time,
            guests,
            specialRequest,
        } = req.body;

        res.status(200).json({
            success: true,
            message: "Dining table booked successfully!",
            booking: {
                bookingId: `TB-${Date.now().toString().slice(-6)}`,
                restaurantId,
                restaurantName,
                userName,
                userPhone,
                date: date || new Date().toISOString().split('T')[0],
                time: time || '08:00 PM',
                guests: guests || 2,
                specialRequest: specialRequest || '',
                status: 'CONFIRMED',
                createdAt: new Date(),
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            error,
        });
    }
});
