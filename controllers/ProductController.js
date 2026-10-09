const mongoose = require("mongoose");
const Product = require("../models/ProductModel");
const Restaurant = require("../models/RestaurantModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");
const { withTimingMeta } = require("../utils/restaurantTiming");

exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      product,
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

exports.getProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    const product = await Product.find();
    res.status(201).json({
      success: true,
      product: product,
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

exports.getallProductbySearch_keyword = async (req, res, next) => {
  try {
    const product = await Product.find({
      name: { $regex: `.*${req.params.keywords}*.`, $options: "i" },
    });
    res.status(201).json({
      success: true,
      products: product,
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
exports.getallProductbySearch_keyword_limit10 = async (req, res, next) => {
  try {
    const product = await Product.find({
      name: { $regex: `.*${req.params.keywords}*.`, $options: "i" },
    }).limit(5);
    res.status(201).json({
      success: true,
      products: product,
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

exports.getProductwithrestaurantAgregate = catchAsyncErrors(
  async (req, res, next) => {
    try {
      const product = await Restaurant.aggregate([
        {
          $lookup: {
            from: "products",
            let: { restaurantId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$restauntId", "$$restaurantId"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  description: {
                    $ifNull: ["$description", "Freshly prepared"],
                  },
                  thumbnail: { $ifNull: ["$thumbnail", ""] },
                  image: { $ifNull: ["$thumbnail", ""] },
                  veg: { $ifNull: ["$veg", false] },
                  Nonveg: { $ifNull: ["$Nonveg", false] },
                  category: 1,
                  price: {
                    $cond: [
                      { $gt: [{ $size: "$packSize" }, 0] },
                      {
                        $ifNull: [{ $arrayElemAt: ["$packSize.Price", 0] }, 0],
                      },
                      0,
                    ],
                  },
                  createdAt: 1,
                },
              },
            ],
            as: "products",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            logo: 1,
            image: { $ifNull: ["$logo", ""] },
            rating: { $ifNull: ["$rating", 0] },
            reviews: { $ifNull: ["$ratingCount", 0] },
            cuisine: {
              $ifNull: [{ $arrayElemAt: ["$categories", 0] }, "Popular dishes"],
            },
            time: {
              $concat: [
                { $ifNull: ["$minDeliveryTiming", "15"] },
                " - ",
                { $ifNull: ["$maxDeliveryTiming", "45"] },
                " mins",
              ],
            },
            products: 1,
          },
        },
      ]);
      res.status(201).json({
        success: true,
        product: product,
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
  },
);

exports.getHomeRestaurantPreview = catchAsyncErrors(async (req, res, next) => {
  const restaurantLimit = Math.min(Number(req.query.restaurantLimit) || 6, 10);
  const productLimit = Math.min(Number(req.query.productLimit) || 6, 10);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const hasLocation =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  const nearbyStages = hasLocation
    ? [
        {
          $addFields: {
            _restaurantLatitude: {
              $convert: {
                input: "$Latitude",
                to: "double",
                onError: null,
                onNull: null,
              },
            },
            _restaurantLongitude: {
              $convert: {
                input: "$Longitude",
                to: "double",
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $match: {
            _restaurantLatitude: { $ne: null },
            _restaurantLongitude: { $ne: null },
          },
        },
        {
          $addFields: {
            _distanceKm: {
              $multiply: [
                6371,
                {
                  $acos: {
                    $min: [
                      1,
                      {
                        $max: [
                          -1,
                          {
                            $add: [
                              {
                                $multiply: [
                                  { $sin: { $degreesToRadians: latitude } },
                                  {
                                    $sin: {
                                      $degreesToRadians: "$_restaurantLatitude",
                                    },
                                  },
                                ],
                              },
                              {
                                $multiply: [
                                  { $cos: { $degreesToRadians: latitude } },
                                  {
                                    $cos: {
                                      $degreesToRadians: "$_restaurantLatitude",
                                    },
                                  },
                                  {
                                    $cos: {
                                      $degreesToRadians: {
                                        $subtract: [
                                          "$_restaurantLongitude",
                                          longitude,
                                        ],
                                      },
                                    },
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        { $sort: { _distanceKm: 1, _id: 1 } },
      ]
    : [{ $sort: { createdAt: -1 } }];

  const [total, product] = await Promise.all([
    Restaurant.countDocuments(
      hasLocation
        ? {
            Latitude: { $exists: true, $ne: "" },
            Longitude: { $exists: true, $ne: "" },
          }
        : {},
    ),
    Restaurant.aggregate([
      ...nearbyStages,
      { $skip: (page - 1) * restaurantLimit },
      { $limit: restaurantLimit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "restauntId",
          pipeline: [
            { $sort: { createdAt: -1 } },
            { $limit: productLimit },
            {
              $project: {
                _id: 1,
                name: 1,
                description: { $ifNull: ["$description", "Freshly prepared"] },
                image: { $ifNull: ["$thumbnail", ""] },
                veg: { $ifNull: ["$veg", false] },
                Nonveg: { $ifNull: ["$Nonveg", false] },
                price: {
                  $cond: [
                    { $gt: [{ $size: { $ifNull: ["$packSize", []] } }, 0] },
                    { $ifNull: [{ $arrayElemAt: ["$packSize.Price", 0] }, 0] },
                    0,
                  ],
                },
              },
            },
          ],
          as: "products",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: { $ifNull: ["$logo", ""] },
          rating: { $ifNull: ["$rating", 0] },
          reviews: { $ifNull: ["$ratingCount", 0] },
          categories: { $slice: ["$categories", 3] },
          address: { $ifNull: ["$address", "Nearby"] },
          Branch: { $ifNull: ["$Branch", ""] },
          Latitude: 1,
          Longitude: 1,
          cuisine: {
            $ifNull: [{ $arrayElemAt: ["$categories", 0] }, "Popular dishes"],
          },
          time: {
            $concat: [
              { $ifNull: ["$minDeliveryTiming", "15"] },
              " - ",
              { $ifNull: ["$maxDeliveryTiming", "45"] },
              " mins",
            ],
          },
          products: 1,
        },
      },
    ]),
  ]);

  const normalizedProduct = Array.isArray(product)
    ? product.map(restaurant => withTimingMeta(restaurant))
    : product;

  res.status(200).json({
    success: true,
    product: normalizedProduct,
    count: total,
    page,
    pageSize: restaurantLimit,
    hasMore: page * restaurantLimit < total,
  });
});
exports.getProductwithrestaurantAgregate_search_limit = catchAsyncErrors(
  async (req, res, next) => {
    try {
      const keywords = (
        req.params.keywords ||
        req.query.keyword ||
        req.query.keywords ||
        ""
      ).trim();
      const matchStage = keywords
        ? {
            $match: {
              $or: [
                {
                  name: {
                    $regex: keywords.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                    $options: "i",
                  },
                },
                {
                  categories: {
                    $regex: keywords.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                    $options: "i",
                  },
                },
                {
                  address: {
                    $regex: keywords.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                    $options: "i",
                  },
                },
                {
                  Branch: {
                    $regex: keywords.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                    $options: "i",
                  },
                },
                {
                  "products.name": {
                    $regex: keywords.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                    $options: "i",
                  },
                },
              ],
            },
          }
        : { $match: {} };

      const product = await Restaurant.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "restauntId",
            as: "products",
          },
        },
        matchStage,
      ]).limit(15);

      res.status(200).json({
        success: true,
        count: product.length,
        product: product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error._message || error.message,
        error: error,
      });
    }
  },
);
exports.getProductwithrestaurantAgregate_by_cat = catchAsyncErrors(
  async (req, res, next) => {
    try {
      const product = await Restaurant.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "restauntId",
            pipeline: [
              {
                $match: {
                  category: req.params.category,
                  status: true,
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 6 },
            ],
            as: "products",
          },
        },
        {
          $match: {
            "products.0": { $exists: true },
          },
        },
      ]).limit(7);
      res.status(201).json({
        success: true,
        count: product.length,
        product: product,
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
  },
);

exports.getProductbyRestaurant = catchAsyncErrors(async (req, res, next) => {
  try {
    const product = await Product.find({ restauntId: req.params.restauntId });
    res.status(201).json({
      success: true,
      product: product,
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

exports.UpdateProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    let product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(200).json({
        success: false,
        message: "product not found",
      });
    }
    product = await Product.findByIdAndUpdate(req.body.productId, req.body, {
      new: true,
      useFindAndModify: false,
      runValidators: true,
    });
    res.status(200).json({
      success: true,
      product: product,
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

exports.DeleteProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    let product = await Product.deleteOne({ _id: req.body.productId });
    if (!product) {
      return res.status(200).json({
        success: false,
        message: "product not found",
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

exports.verify_Product_Slugurl = catchAsyncErrors(async (req, res, next) => {
  try {
    let product = await Product.findOne({
      slugUrl: req.params.slugUrl,
    });

    if (!product) {
      return res.status(200).json({
        success: false,
        message: "new product slugUrl",
      });
    }

    return res.status(200).json({
      success: true,
      message: " restaurant slugUrl already exist",
      product: product,
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

exports.Upload_Product_Image = catchAsyncErrors(async (req, res, next) => {
  try {
    const image = await cloudinary.v2.uploader.upload(req.body.logo, {
      folder: "Product/image",
      format: "webp",
    });
    const images = image.secure_url;
    res.status(200).json({
      success: true,
      image: images,
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

exports.searchProducts = catchAsyncErrors(async (req, res, next) => {
  try {
    const {
      keyword = "",
      q = "",
      veg,
      nonveg,
      dietary,
      rating,
      minRating,
      maxPrice,
      minPrice,
      category,
      sortBy = "relevance",
      page = 1,
      limit = 30,
    } = req.query;

    const searchTerm = (keyword || q || req.params.keywords || "").trim();
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const matchQuery = {};

    if (searchTerm) {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      matchQuery.$or = [
        { name: regex },
        { description: regex },
        { category: regex },
        { keywords: regex },
        { searchkeywords: regex },
        { restaunt: regex },
      ];
    }

    if (dietary === "veg" || veg === "true" || veg === true) {
      const vegCondition = [{ veg: true }, { Nonveg: false }];
      if (matchQuery.$or) {
        matchQuery.$and = [{ $or: matchQuery.$or }, { $or: vegCondition }];
        delete matchQuery.$or;
      } else {
        matchQuery.$or = vegCondition;
      }
    } else if (dietary === "nonveg" || nonveg === "true" || nonveg === true) {
      matchQuery.Nonveg = true;
    }

    const targetRating = Number(rating || minRating);
    if (!isNaN(targetRating) && targetRating > 0) {
      matchQuery.rating = { $gte: targetRating };
    }

    if (category && category !== "All") {
      matchQuery.category = { $regex: new RegExp(category.trim(), "i") };
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $addFields: {
          price: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$packSize", []] } }, 0] },
              { $min: "$packSize.Price" },
              0,
            ],
          },
          displayPrice: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$packSize", []] } }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$packSize.Price", 0] }, 0] },
              0,
            ],
          },
          packSizes: { $ifNull: ["$packSize", []] },
        },
      },
    ];

    const priceMatch = {};
    if (maxPrice !== undefined && maxPrice !== "" && !isNaN(Number(maxPrice))) {
      priceMatch.price = {
        ...(priceMatch.price || {}),
        $lte: Number(maxPrice),
      };
    }
    if (minPrice !== undefined && minPrice !== "" && !isNaN(Number(minPrice))) {
      priceMatch.price = {
        ...(priceMatch.price || {}),
        $gte: Number(minPrice),
      };
    }
    if (Object.keys(priceMatch).length > 0) {
      pipeline.push({ $match: priceMatch });
    }

    pipeline.push(
      {
        $lookup: {
          from: "restaurants",
          localField: "restauntId",
          foreignField: "_id",
          as: "restaurantData",
        },
      },
      {
        $addFields: {
          restaurantDetails: { $arrayElemAt: ["$restaurantData", 0] },
          restaurantName: {
            $ifNull: [
              "$restaunt",
              { $arrayElemAt: ["$restaurantData.name", 0] },
              "Restaurant",
            ],
          },
          restaurantLogo: {
            $ifNull: [{ $arrayElemAt: ["$restaurantData.logo", 0] }, ""],
          },
          restaurantRating: {
            $ifNull: [
              { $arrayElemAt: ["$restaurantData.rating", 0] },
              "$rating",
              4.2,
            ],
          },
          restaurantReviews: {
            $ifNull: [{ $arrayElemAt: ["$restaurantData.ratingCount", 0] }, 0],
          },
          restaurantBranch: {
            $ifNull: [
              { $arrayElemAt: ["$restaurantData.Branch", 0] },
              { $arrayElemAt: ["$restaurantData.address", 0] },
              "Nearby",
            ],
          },
          restaurantDeliveryTime: {
            $concat: [
              {
                $ifNull: [
                  { $arrayElemAt: ["$restaurantData.minDeliveryTiming", 0] },
                  "20",
                ],
              },
              " - ",
              {
                $ifNull: [
                  { $arrayElemAt: ["$restaurantData.maxDeliveryTiming", 0] },
                  "35",
                ],
              },
              " mins",
            ],
          },
        },
      },
    );

    let sortStage = { createdAt: -1 };
    if (
      sortBy === "low_to_high" ||
      sortBy === "price_low_to_high" ||
      sortBy === "price_asc"
    ) {
      sortStage = { price: 1, _id: 1 };
    } else if (
      sortBy === "high_to_low" ||
      sortBy === "price_high_to_low" ||
      sortBy === "price_desc"
    ) {
      sortStage = { price: -1, _id: 1 };
    } else if (sortBy === "rating" || sortBy === "rating_high_to_low") {
      sortStage = { rating: -1, ratingCount: -1 };
    } else if (sortBy === "relevance" || sortBy === "newest") {
      sortStage = { createdAt: -1 };
    }
    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limitNum }],
      },
    });

    const results = await Product.aggregate(pipeline);
    const total = results[0]?.metadata[0]?.total || 0;
    const products = results[0]?.data || [];

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      hasMore: pageNum * limitNum < total,
      products,
      filtersApplied: {
        keyword: searchTerm,
        dietary:
          dietary ||
          (veg === "true" ? "veg" : nonveg === "true" ? "nonveg" : "all"),
        maxPrice: maxPrice ? Number(maxPrice) : null,
        minPrice: minPrice ? Number(minPrice) : null,
        rating: targetRating || null,
        sortBy,
        category: category || "All",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search products",
      error,
    });
  }
});

exports.getSearchSuggestions = catchAsyncErrors(async (req, res, next) => {
  try {
    const keyword = (req.query.keyword || req.query.q || "").trim();
    const defaultPopular = [
      "Biryani",
      "Pizza",
      "Burger",
      "Chicken",
      "Paneer",
      "Mutton",
      "Rolls",
      "Fried Rice",
      "Noodles",
      "Shawarma",
    ];

    if (!keyword) {
      return res.status(200).json({
        success: true,
        keyword: "",
        suggestions: [],
        popular: defaultPopular,
      });
    }

    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const [products, restaurants] = await Promise.all([
      Product.find({
        $or: [
          { name: regex },
          { category: regex },
          { keywords: regex },
          { searchkeywords: regex },
        ],
      })
        .select(
          "_id name thumbnail category packSize veg Nonveg rating restaunt",
        )
        .lean()
        .limit(8),
      Restaurant.find({ name: regex })
        .select("_id name logo rating categories Branch address")
        .lean()
        .limit(4),
    ]);

    const suggestions = products.map((item) => {
      const firstPrice =
        item.packSize && item.packSize.length > 0 ? item.packSize[0].Price : 0;
      return {
        id: item._id,
        name: item.name,
        category: item.category,
        restaurant: item.restaunt || "",
        price: firstPrice,
        veg: !!item.veg,
        nonveg: !!item.Nonveg,
        rating: item.rating || 4.2,
        image: item.thumbnail || "",
        type: "dish",
      };
    });

    const restaurantSuggestions = restaurants.map((r) => ({
      id: r._id,
      name: r.name,
      category:
        r.categories && r.categories.length > 0
          ? r.categories[0]
          : "Restaurant",
      restaurant: r.name,
      location: r.Branch || r.address || "Nearby",
      rating: r.rating || 4.2,
      image: r.logo || "",
      type: "restaurant",
    }));

    res.status(200).json({
      success: true,
      keyword,
      suggestions: [...suggestions, ...restaurantSuggestions],
      popular: defaultPopular,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch suggestions",
      error,
    });
  }
});

exports.getProductbyRestaurant = catchAsyncErrors(async (req, res, next) => {
  try {
    const { restauntId } = req.params;
    let restaurantQuery = {};
    if (mongoose.Types.ObjectId.isValid(restauntId)) {
      restaurantQuery = { _id: restauntId };
    } else {
      restaurantQuery = { name: new RegExp(restauntId, 'i') };
    }

    const [restaurant, products] = await Promise.all([
      Restaurant.findOne(restaurantQuery).lean(),
      Product.find({
        $or: [
          { restauntId: restauntId },
          ...(mongoose.Types.ObjectId.isValid(restauntId) ? [{ restauntId: new mongoose.Types.ObjectId(restauntId) }] : []),
          { restaunt: new RegExp(restauntId, 'i') }
        ]
      }).lean().sort({ createdAt: -1 })
    ]);

    const formattedProducts = (products || []).map(p => {
      const firstPrice = p.packSize && p.packSize.length > 0 ? p.packSize[0].Price : (p.price || 0);
      return {
        ...p,
        id: p._id,
        price: firstPrice,
        image: p.thumbnail || p.image || '',
        veg: !!p.veg,
        nonVeg: !!p.Nonveg,
        trending: !!p.trending,
        recommendation: !!p.recommendation,
      };
    });

    const categories = ['All Items', ...new Set(formattedProducts.map(p => p.category).filter(Boolean))];
    const trending = formattedProducts.filter(p => !!p.trending);
    const recommendation = formattedProducts.filter(p => !!p.recommendation);

    res.status(200).json({
      success: true,
      restaurant: restaurant || {
        _id: restauntId,
        name: 'Restaurant',
        rating: 4.5,
        ratingCount: 150,
        address: 'Nearby',
        minDeliveryTiming: '25',
        maxDeliveryTiming: '35',
        categories: ['Multi-Cuisine'],
      },
      categories,
      trending,
      recommendation,
      products: formattedProducts,
      total: formattedProducts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch restaurant menu',
      error,
    });
  }
});
