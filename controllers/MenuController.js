const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const Product = require("../models/ProductModel");
const Restaurant = require("../models/RestaurantModel");
const Category = require("../models/categoryModel");
const Subcategory = require("../models/subCategoryModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const toSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const createUniqueSlug = async (name, excludeId) => {
  const base = toSlug(name) || "menu-item";
  let slug = base;
  let counter = 2;

  while (
    await Product.exists({
      slugUrl: slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${counter++}`;
  }

  return slug;
};

const menuItemResponse = (product) => {
  const item = product.toObject ? product.toObject() : product;
  const price = Number(item.price ?? item.packSize?.[0]?.Price ?? 0);

  return {
    ...item,
    price,
    discount_price: Number(item.discount_price ?? price),
    image: item.image || item.thumbnail || "",
    isAvailable: item.status ?? item.isAvailable ?? true,
    isVeg: item.veg ?? item.isVeg ?? false,
    recommended: item.recommendation ?? item.recommended ?? false,
    categoryId: item.categoryId || { name: item.category || "Uncategorized" },
    subcategoryId: item.subcategoryId || null,
  };
};

const findMenuItem = (id) =>
  Product.findById(id).populate("categoryId", "name slugUrl").populate("subcategoryId", "name slugUrl");

const resolveMenuRelations = async ({ restaurantId, categoryId, subcategoryId }) => {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return { error: "A valid restaurantId is required." };
  }
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return { error: "A valid categoryId is required." };
  }

  const [restaurant, category, subcategory] = await Promise.all([
    Restaurant.findById(restaurantId).select("name"),
    Category.findById(categoryId).select("name slugUrl"),
    subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId)
      ? Subcategory.findById(subcategoryId).select("name slugUrl categoryUrl")
      : null,
  ]);

  if (!restaurant) return { error: "Restaurant not found." };
  if (!category) return { error: "Category not found." };
  if (subcategoryId && !subcategory) return { error: "Subcategory not found." };

  return { restaurant, category, subcategory };
};

const buildProductPayload = ({ body, relations, existing }) => {
  const price = Number(body.price);
  const discountPrice = body.discount_price === "" || body.discount_price === undefined
    ? price
    : Number(body.discount_price);
  const isVeg = body.isVeg ?? existing?.isVeg ?? existing?.veg ?? true;
  const status = body.status ?? body.isAvailable ?? existing?.status ?? existing?.isAvailable ?? true;
  const image = body.image || existing?.image || existing?.thumbnail || "";
  const packSize = Array.isArray(body.packSize) && body.packSize.length
    ? body.packSize.map((pack, index) => ({
        packSizeName: String(pack.packSizeName || `Pack ${index + 1}`).trim(),
        Price: Number(pack.Price),
        Prime: Boolean(pack.Prime),
      }))
    : existing?.packSize?.length
      ? existing.packSize
      : [{ packSizeName: "Regular", Price: price, Prime: true }];
  const menuTypes = Array.isArray(body.menu_types) && body.menu_types.length
    ? body.menu_types.map((type) => String(type).trim()).filter(Boolean)
    : existing?.menu_types?.length
      ? existing.menu_types
      : [relations.subcategory?.name || relations.category.name];

  return {
    name: body.name?.trim(),
    description: body.description ?? existing?.description ?? "",
    restauntId: relations.restaurant._id,
    restaunt: relations.restaurant.name,
    category: relations.category.name,
    categoryUrl: relations.category.slugUrl,
    categoryId: relations.category._id,
    subcategoryId: relations.subcategory?._id,
    veg: Boolean(isVeg),
    Nonveg: !Boolean(isVeg),
    menu_types: menuTypes,
    status: Boolean(status),
    OutOfStack: existing?.OutOfStack ?? false,
    thumbnail: image,
    image,
    price,
    discount_price: discountPrice,
    isAvailable: Boolean(status),
    estimateTimePrepareMenuItem: Number(body.estimateTimePrepareMenuItem ?? existing?.estimateTimePrepareMenuItem ?? 60),
    isVeg: Boolean(isVeg),
    recommended: Boolean(body.recommended ?? existing?.recommended ?? false),
    recommendation: Boolean(body.recommended ?? existing?.recommendation ?? false),
    trending: Boolean(body.trending ?? existing?.trending ?? false),
    searchkeywords: body.searchkeywords?.trim() || existing?.searchkeywords || body.name?.trim() || "",
    keywords: body.keywords?.trim() || existing?.keywords || body.searchkeywords?.trim() || body.name?.trim() || "",
    packSize,
  };
};

exports.listMenuItems = catchAsyncErrors(async (req, res) => {
  const { restaurantId, page = 1, limit = 10, search = "", categoryId, isAvailable, sortBy = "createdAt", sortOrder = "desc" } = req.query;
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res.status(400).json({ success: false, message: "A valid restaurantId is required." });
  }

  const filter = { restauntId: restaurantId };
  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) filter.categoryId = categoryId;
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";
  if (search.trim()) filter.$or = [{ name: new RegExp(search.trim(), "i") }, { description: new RegExp(search.trim(), "i") }];

  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const allowedSortFields = ["createdAt", "name", "price"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("categoryId", "name slugUrl")
      .populate("subcategoryId", "name slugUrl")
      .sort(sort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items.map(menuItemResponse),
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.max(Math.ceil(total / safeLimit), 1) },
  });
});

exports.getMenuItem = catchAsyncErrors(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid menu item id." });
  }
  const item = await findMenuItem(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Menu item not found." });
  res.status(200).json({ success: true, data: menuItemResponse(item) });
});

exports.createMenuItem = catchAsyncErrors(async (req, res) => {
  if (!req.body.name?.trim() || !Number.isFinite(Number(req.body.price)) || Number(req.body.price) <= 0 || !req.body.image) {
    return res.status(400).json({ success: false, message: "Name, a valid price, category, and image are required." });
  }
  const relations = await resolveMenuRelations(req.body);
  if (relations.error) return res.status(400).json({ success: false, message: relations.error });

  const product = await Product.create({
    ...buildProductPayload({ body: req.body, relations }),
    slugUrl: await createUniqueSlug(req.body.name),
  });
  const populated = await findMenuItem(product._id);
  res.status(201).json({ success: true, data: menuItemResponse(populated) });
});

exports.updateMenuItem = catchAsyncErrors(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid menu item id." });
  }
  const existing = await Product.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: "Menu item not found." });

  let legacyCategoryId = existing.categoryId;
  if (!legacyCategoryId && existing.categoryUrl) {
    const legacyCategory = await Category.findOne({ slugUrl: existing.categoryUrl }).select("_id");
    legacyCategoryId = legacyCategory?._id;
  }
  const relations = await resolveMenuRelations({
    restaurantId: req.body.restaurantId || existing.restauntId,
    categoryId: req.body.categoryId || legacyCategoryId,
    subcategoryId: req.body.subcategoryId ?? existing.subcategoryId,
  });
  if (relations.error) return res.status(400).json({ success: false, message: relations.error });
  if (req.body.price !== undefined && (!Number.isFinite(Number(req.body.price)) || Number(req.body.price) <= 0)) {
    return res.status(400).json({ success: false, message: "Price must be greater than zero." });
  }

  const payload = buildProductPayload({ body: { ...existing.toObject(), ...req.body, name: req.body.name || existing.name, price: req.body.price ?? existing.price ?? existing.packSize?.[0]?.Price }, relations, existing });
  if (req.body.name && req.body.name.trim() !== existing.name) payload.slugUrl = await createUniqueSlug(req.body.name, existing._id);
  const item = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
    .populate("categoryId", "name slugUrl")
    .populate("subcategoryId", "name slugUrl");
  res.status(200).json({ success: true, data: menuItemResponse(item) });
});

exports.deleteMenuItem = catchAsyncErrors(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid menu item id." });
  }
  const item = await Product.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Menu item not found." });
  res.status(200).json({ success: true, data: { _id: req.params.id } });
});

exports.uploadMenuImage = catchAsyncErrors(async (req, res) => {
  if (!req.body.image) return res.status(400).json({ success: false, message: "An image is required." });
  const result = await cloudinary.v2.uploader.upload(req.body.image, {
    folder: req.body.folder || "Menu/Items",
    format: "webp",
  });
  res.status(200).json({ success: true, imageUrl: result.secure_url });
});
