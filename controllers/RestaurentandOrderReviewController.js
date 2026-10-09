const RestaurentandOrderReview = require("../models/RestaurentandOrderReviewModel");
const Restaurant = require("../models/RestaurantModel");
const Product = require("../models/ProductModel");
const Order = require("../models/OrderModel");
const DeliveryPersion = require("../models/DeliveryPersionModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// CREATE OR UPDATE ORDER & RESTAURANT & RIDER REVIEW
exports.createRestaurentandOrderReview = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            OrderId,
            RestaurentId,
            userId,
            Username,
            rating,
            comment,
            restaurantRating,
            restaurantComment,
            restaurantCompliments,
            DeliveryPersionId,
            DeliveryPersionName,
            riderRating,
            riderComment,
            riderCompliments,
            restauntName,
            orderTotal,
            productIds,
        } = req.body;

        if (!OrderId) {
            return res.status(400).json({
                success: false,
                message: "OrderId is required",
            });
        }

        const effectiveRestaurantRating = Number(restaurantRating || rating || 5);
        const effectiveRestaurantComment = (restaurantComment !== undefined ? restaurantComment : comment) || "";
        const effectiveRiderRating = Number(riderRating || 5);

        // Fetch order to backfill missing restaurant or rider info
        const orderData = await Order.findById(OrderId);
        const finalRestaurentId = RestaurentId || orderData?.restauntId;
        const finalRestauntName = restauntName || orderData?.restauntName || "";
        const finalDeliveryPersionId = DeliveryPersionId || orderData?.DeliveryPersionId;
        const finalDeliveryPersionName = DeliveryPersionName || orderData?.DeliveryPersionName || "";
        const finalOrderTotal = orderTotal || orderData?.grand_total || orderData?.total_Amount || 0;
        const finalProductIds = (productIds && productIds.length > 0)
            ? productIds
            : (orderData?.produucts || []).map((p) => ({
                productId: p.productId,
                name: p.name,
            }));

        let review = await RestaurentandOrderReview.findOne({ OrderId });

        if (!review) {
            review = await RestaurentandOrderReview.create({
                userId,
                Username: Username || orderData?.Username || "Customer",
                RestaurentId: finalRestaurentId,
                restauntName: finalRestauntName,
                OrderId,
                orderTotal: finalOrderTotal,
                rating: effectiveRestaurantRating,
                comment: effectiveRestaurantComment,
                restaurantRating: effectiveRestaurantRating,
                restaurantComment: effectiveRestaurantComment,
                restaurantCompliments: restaurantCompliments || [],
                DeliveryPersionId: finalDeliveryPersionId || null,
                DeliveryPersionName: finalDeliveryPersionName,
                riderRating: effectiveRiderRating,
                riderComment: riderComment || "",
                riderCompliments: riderCompliments || [],
                productIds: finalProductIds,
            });
        } else {
            // Update existing review
            review.rating = effectiveRestaurantRating;
            review.comment = effectiveRestaurantComment;
            review.restaurantRating = effectiveRestaurantRating;
            review.restaurantComment = effectiveRestaurantComment;
            if (restaurantCompliments) review.restaurantCompliments = restaurantCompliments;
            if (finalDeliveryPersionId) review.DeliveryPersionId = finalDeliveryPersionId;
            if (finalDeliveryPersionName) review.DeliveryPersionName = finalDeliveryPersionName;
            review.riderRating = effectiveRiderRating;
            if (riderComment !== undefined) review.riderComment = riderComment;
            if (riderCompliments) review.riderCompliments = riderCompliments;
            await review.save();
        }

        // 1. Update Order status with rating flags
        const updatedOrder = await Order.findByIdAndUpdate(
            OrderId,
            {
                rating: effectiveRestaurantRating,
                riderRating: effectiveRiderRating,
                isRated: true,
            },
            {
                new: true,
                useFindAndModify: false,
                runValidators: false,
            }
        );

        // 2. Aggregate & Update Restaurant Rating
        if (finalRestaurentId) {
            const restaurantAgg = await RestaurentandOrderReview.aggregate([
                { $match: { RestaurentId: new ObjectId(finalRestaurentId) } },
                {
                    $group: {
                        _id: "$RestaurentId",
                        averageRating: { $avg: "$restaurantRating" },
                        totalReviews: { $sum: 1 },
                    },
                },
            ]);

            if (restaurantAgg.length > 0) {
                await Restaurant.findByIdAndUpdate(
                    finalRestaurentId,
                    {
                        rating: Number(restaurantAgg[0].averageRating.toFixed(2)),
                        ratingCount: restaurantAgg[0].totalReviews,
                    },
                    { new: true, useFindAndModify: false, runValidators: false }
                );
            }
        }

        // 3. Aggregate & Update Delivery Person (Rider) Rating
        if (finalDeliveryPersionId) {
            const riderAgg = await RestaurentandOrderReview.aggregate([
                {
                    $match: {
                        DeliveryPersionId: new ObjectId(finalDeliveryPersionId),
                        riderRating: { $exists: true, $gt: 0 },
                    },
                },
                {
                    $group: {
                        _id: "$DeliveryPersionId",
                        averageRating: { $avg: "$riderRating" },
                        totalReviews: { $sum: 1 },
                    },
                },
            ]);

            if (riderAgg.length > 0) {
                await DeliveryPersion.findByIdAndUpdate(
                    finalDeliveryPersionId,
                    {
                        rating: Number(riderAgg[0].averageRating.toFixed(2)),
                        ratingCount: riderAgg[0].totalReviews,
                    },
                    { new: true, useFindAndModify: false, runValidators: false }
                );
            }
        }

        // 4. Aggregate Product Ratings
        if (finalProductIds && finalProductIds.length > 0) {
            for (let i = 0; i < finalProductIds.length; i++) {
                const prodId = finalProductIds[i]?.productId;
                if (prodId && mongoose.isValidObjectId(prodId)) {
                    const prodAgg = await RestaurentandOrderReview.aggregate([
                        { $match: { "productIds.productId": new ObjectId(prodId) } },
                        {
                            $group: {
                                _id: "$productId",
                                averageRating: { $avg: "$rating" },
                                totalReviews: { $sum: 1 },
                            },
                        },
                    ]);

                    if (prodAgg.length > 0) {
                        await Product.findByIdAndUpdate(
                            prodId,
                            {
                                rating: Number(prodAgg[0].averageRating.toFixed(2)),
                                ratingCount: prodAgg[0].totalReviews,
                            },
                            { new: true, useFindAndModify: false, runValidators: false }
                        );
                    }
                }
            }
        }

        return res.status(201).json({
            success: true,
            massage: "Review submitted successfully",
            message: "Review submitted successfully",
            review,
            order: updatedOrder,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "An error occurred",
            error,
        });
    }
});

// GET USER'S REVIEWS (FOR PROFILE SCREEN)
exports.getUserReviews = catchAsyncErrors(async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const reviews = await RestaurentandOrderReview.find({ userId })
            .populate("RestaurentId", "name address images rating ratingCount profileImage")
            .populate("OrderId", "grand_total total_Amount produucts order_status createdAt orderNumber DeliveryPersionName")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reviews.length,
            reviews,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch user reviews",
        });
    }
});

// GET ALL REVIEWS FOR ADMIN (WITH FILTERING, SORTING BY HIGHEST RATING, STATS)
exports.getAllReviewsForAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            sort = "highest", // 'highest', 'lowest', 'highest_restaurant', 'highest_rider', 'newest'
            type = "all", // 'all', 'restaurant', 'rider'
            search = "",
            minRating,
            page = 1,
            limit = 20,
        } = req.query;

        let query = {};

        if (search && search.trim() !== "") {
            const regex = { $regex: search.trim(), $options: "i" };
            query.$or = [
                { Username: regex },
                { comment: regex },
                { restaurantComment: regex },
                { riderComment: regex },
                { DeliveryPersionName: regex },
                { restauntName: regex },
            ];
        }

        if (minRating) {
            query.rating = { $gte: Number(minRating) };
        }

        if (type === "restaurant") {
            query.rating = { $exists: true, $gt: 0 };
        } else if (type === "rider") {
            query.riderRating = { $exists: true, $gt: 0 };
        }

        // Sorting logic - allows checking highest rating first
        let sortObj = {};
        if (sort === "highest") {
            sortObj = { rating: -1, riderRating: -1, createdAt: -1 };
        } else if (sort === "lowest") {
            sortObj = { rating: 1, riderRating: 1, createdAt: -1 };
        } else if (sort === "highest_restaurant") {
            sortObj = { rating: -1, createdAt: -1 };
        } else if (sort === "highest_rider") {
            sortObj = { riderRating: -1, createdAt: -1 };
        } else if (sort === "newest") {
            sortObj = { createdAt: -1 };
        } else {
            sortObj = { rating: -1, createdAt: -1 };
        }

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        const totalReviews = await RestaurentandOrderReview.countDocuments(query);
        const reviews = await RestaurentandOrderReview.find(query)
            .populate("RestaurentId", "name address rating ratingCount logo profileImage")
            .populate("OrderId", "grand_total total_Amount produucts order_status createdAt orderNumber")
            .populate("DeliveryPersionId", "name mobile vehicleNumber rating ratingCount profileImage")
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // Aggregate high-level admin statistics
        const statsAgg = await RestaurentandOrderReview.aggregate([
            {
                $group: {
                    _id: null,
                    avgRestaurantRating: { $avg: "$rating" },
                    avgRiderRating: { $avg: "$riderRating" },
                    totalCount: { $sum: 1 },
                    fiveStarCount: { $sum: { $cond: [{ $gte: ["$rating", 5] }, 1, 0] } },
                    fourStarCount: { $sum: { $cond: [{ $and: [{ $gte: ["$rating", 4] }, { $lt: ["$rating", 5] }] }, 1, 0] } },
                    threeStarCount: { $sum: { $cond: [{ $and: [{ $gte: ["$rating", 3] }, { $lt: ["$rating", 4] }] }, 1, 0] } },
                    lowStarCount: { $sum: { $cond: [{ $lt: ["$rating", 3] }, 1, 0] } },
                },
            },
        ]);

        // Find top highest rated restaurants and riders
        const topRestaurants = await Restaurant.find({ ratingCount: { $gt: 0 } })
            .sort({ rating: -1, ratingCount: -1 })
            .limit(5)
            .select("name address rating ratingCount profileImage logo");

        const topRiders = await DeliveryPersion.find({ ratingCount: { $gt: 0 } })
            .sort({ rating: -1, ratingCount: -1 })
            .limit(5)
            .select("name mobile rating ratingCount vehicleNumber profileImage");

        const summaryStats = statsAgg[0] || {
            avgRestaurantRating: 5,
            avgRiderRating: 5,
            totalCount: totalReviews,
            fiveStarCount: 0,
            fourStarCount: 0,
            threeStarCount: 0,
            lowStarCount: 0,
        };

        return res.status(200).json({
            success: true,
            totalReviews,
            currentPage: pageNum,
            totalPages: Math.ceil(totalReviews / limitNum),
            stats: {
                ...summaryStats,
                avgRestaurantRating: Number((summaryStats.avgRestaurantRating || 5).toFixed(2)),
                avgRiderRating: Number((summaryStats.avgRiderRating || 5).toFixed(2)),
            },
            topRestaurants,
            topRiders,
            reviews,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch admin reviews",
        });
    }
});

exports.getReviewbyRestaurant = catchAsyncErrors(async (req, res, next) => {
    try {
        const review = await RestaurentandOrderReview.find({ RestaurentId: req.params.RestaurentId });
        res.status(200).json({
            success: true,
            review: review,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            massage: error.message,
            error: error,
        });
    }
});

exports.getReviewbyProduct = catchAsyncErrors(async (req, res, next) => {
    try {
        const review = await RestaurentandOrderReview.find({ "productIds.productId": req.params.productId });
        res.status(200).json({
            success: true,
            review: review,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            massage: error.message,
            error: error,
        });
    }
});
