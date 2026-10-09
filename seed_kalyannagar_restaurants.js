const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Restaurant = require("./models/RestaurantModel");
const Product = require("./models/ProductModel");

dotenv.config({ path: "config/config.env" });

const seedData = [
  {
    restaurant: {
      name: "Pista House - Kalyan Nagar Phase",
      mobile: 9849123401,
      email: "pistahouse.kalyannagar@fooddelivery.com",
      Delivery_type: "Delivery",
      delivery_Commission: "10",
      pickup_Commission: "5",
      GST: "36AAACP1234F1Z1",
      FSSAI_Lic_No: "13622011000101",
      logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
      gst_percentage: 5,
      contact_number: "9849123401",
      Latitude: "17.4475",
      Longitude: "78.4382",
      Branch: "Kalyan Nagar Phase 1",
      address: "Plot 12, Kalyan Nagar Phase 1, Main Road, Hyderabad, Telangana 500038",
      open_status: true,
      status: true,
      categories: ["Biryani", "North Indian", "Mughlai", "Fast Food"],
      preparationTiming: "20",
      minDeliveryTiming: "20",
      maxDeliveryTiming: "40",
      rating: 4.6,
      ratingCount: 1420,
      is_dining_available: true,
    },
    products: [
      {
        name: "Hyderabadi Chicken Dum Biryani",
        slugUrl: "pista-house-hyderabadi-chicken-dum-biryani",
        description: "Authentic dum-cooked fragrant basmati rice layered with spiced tender chicken, saffron and mint.",
        category: "Biryani",
        categoryUrl: "biryani",
        veg: false,
        Nonveg: true,
        menu_types: ["Main Course", "Biryani"],
        status: true,
        OutOfStack: false,
        thumbnail: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
        rating: 4.8,
        ratingCount: 520,
        trending: true,
        recommendation: true,
        packSize: [
          { packSizeName: "Single", Price: 220, Prime: false },
          { packSizeName: "Full (2 Persons)", Price: 380, Prime: false },
        ],
      },
      {
        name: "Special Mutton Haleem",
        slugUrl: "pista-house-special-mutton-haleem",
        description: "Rich and wholesome stew of minced mutton, broken wheat, lentils and aromatic desi ghee spices.",
        category: "Mughlai",
        categoryUrl: "mughlai",
        veg: false,
        Nonveg: true,
        menu_types: ["Starters", "Mughlai"],
        status: true,
        OutOfStack: false,
        thumbnail: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800",
        rating: 4.9,
        ratingCount: 880,
        trending: true,
        recommendation: true,
        packSize: [
          { packSizeName: "Single (350ml)", Price: 260, Prime: false },
          { packSizeName: "Family Pack", Price: 690, Prime: false },
        ],
      },
      {
        name: "Butter Chicken & Butter Naan Combo",
        slugUrl: "pista-house-butter-chicken-naan-combo",
        description: "Creamy tandoori chicken simmered in rich buttery makhani gravy served with 2 hot butter naans.",
        category: "North Indian",
        categoryUrl: "north-indian",
        veg: false,
        Nonveg: true,
        menu_types: ["Combo", "Curries"],
        status: true,
        OutOfStack: false,
        thumbnail: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800",
        rating: 4.5,
        ratingCount: 310,
        trending: false,
        recommendation: true,
        packSize: [
          { packSizeName: "Regular Meal", Price: 290, Prime: false },
        ],
      },
    ],
  },
  {
    restaurant: {
      name: "Santosh Dhaba Exclusive - Kalyan Nagar Phase",
      mobile: 9849123402,
      email: "santoshdhaba.kalyannagar@fooddelivery.com",
      Delivery_type: "Delivery",
      delivery_Commission: "10",
      pickup_Commission: "5",
      GST: "36AAACS5678F1Z2",
      FSSAI_Lic_No: "13622011000202",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500",
      gst_percentage: 5,
      contact_number: "9849123402",
      Latitude: "17.4462",
      Longitude: "78.4390",
      Branch: "Kalyan Nagar Phase 2",
      address: "Near Kalyan Nagar Phase 2 Community Hall, Yousufguda Main Rd, Hyderabad 500045",
      open_status: true,
      status: true,
      categories: ["Pure Veg", "North Indian", "Chinese", "Tandoor"],
      preparationTiming: "15",
      minDeliveryTiming: "15",
      maxDeliveryTiming: "35",
      rating: 4.5,
      ratingCount: 980,
      is_dining_available: true,
    },
    products: [
      {
        name: "Special Kaju Paneer Curry",
        slugUrl: "santosh-dhaba-special-kaju-paneer-curry",
        description: "Fresh cottage cheese cubes and roasted cashews cooked in rich creamy onion tomato gravy.",
        category: "North Indian",
        categoryUrl: "north-indian",
        veg: true,
        Nonveg: false,
        menu_types: ["Main Course", "Curries"],
        status: true,
        OutOfStack: false,
        thumbnail: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
        rating: 4.7,
        ratingCount: 420,
        trending: true,
        recommendation: true,
        packSize: [
          { packSizeName: "Regular", Price: 260, Prime: false },
          { packSizeName: "Family Pack", Price: 460, Prime: false },
        ],
      },
      {
        name: "Dal Makhani with 2 Garlic Naan",
        slugUrl: "santosh-dhaba-dal-makhani-garlic-naan",
        description: "Slow-cooked black lentils with cream and butter, paired with freshly baked tandoori garlic naan.",
        category: "Pure Veg",
        categoryUrl: "pure-veg",
        veg: true,
        Nonveg: false,
        menu_types: ["Combo", "Main Course"],
        status: true,
        OutOfStack: false,
        thumbnail: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
        rating: 4.6,
        ratingCount: 310,
        trending: true,
        recommendation: true,
        packSize: [
          { packSizeName: "Single Meal", Price: 210, Prime: false },
        ],
      },
      {
        name: "Veg Manchurian Fried Rice",
        slugUrl: "santosh-dhaba-veg-manchurian-fried-rice",
        description: "Wok-tossed aromatic basmati rice with crunchy vegetable Manchurian balls in tangy soya sauce.",
        category: "Chinese",
        categoryUrl: "chinese",
        veg: true,
        Nonveg: false,
        menu_types: ["Chinese", "Fast Food"],
        status: true,
        OutOfStack: false,
        thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
        rating: 4.4,
        ratingCount: 250,
        trending: false,
        recommendation: false,
        packSize: [
          { packSizeName: "Full", Price: 190, Prime: false },
        ],
      },
    ],
  },
  {
    restaurant: {
      name: "Bawarchi Multi Cuisine - Kalyan Nagar Phase",
      mobile: 9849123403,
      email: "bawarchi.kalyannagar@fooddelivery.com",
      Delivery_type: "Delivery",
      delivery_Commission: "10",
      pickup_Commission: "5",
      GST: "36AAACB9012F1Z3",
      FSSAI_Lic_No: "13622011000303",
      logo: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500",
      gst_percentage: 5,
      contact_number: "9849123403",
      Latitude: "17.4485",
      Longitude: "78.4375",
      Branch: "Kalyan Nagar Phase 1 Venture",
      address: "Shop 5 & 6, Kalyan Nagar Phase 1 Venture, SR Nagar Ext, Hyderabad 500038",
      open_status: true,
      status: true,
      categories: ["Biryani", "Chinese", "Kebabs", "South Indian"],
      preparationTiming: "20",
      minDeliveryTiming: "20",
      maxDeliveryTiming: "40",
      rating: 4.4,
      ratingCount: 750,
      is_dining_available: true,
    },
    products: [
      {
        name: "Crispy Chicken 65 (Wet/Dry)",
        slugUrl: "bawarchi-crispy-chicken-65-kalyannagar",
        description: "Deep fried spicy chicken chunks tossed in South Indian spices, curry leaves and green chilies.",
        category: "Kebabs",
        categoryUrl: "kebabs",
        veg: false,
        Nonveg: true,
        menu_types: ["Starters", "Non-Veg"],
        status: true,
        OutOfStack: false,
        thumbnail: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800",
        rating: 4.6,
        ratingCount: 390,
        trending: true,
        recommendation: true,
        packSize: [
          { packSizeName: "Full Portion", Price: 240, Prime: false },
        ],
      },
      {
        name: "Special Egg Dum Biryani",
        slugUrl: "bawarchi-special-egg-dum-biryani-kalyannagar",
        description: "Fragrant spiced biryani rice loaded with fried boiled eggs and served with mirchi ka salan and raita.",
        category: "Biryani",
        categoryUrl: "biryani",
        veg: false,
        Nonveg: true,
        menu_types: ["Main Course", "Biryani"],
        status: true,
        OutOfStack: false,
        thumbnail: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800",
        rating: 4.5,
        ratingCount: 280,
        trending: false,
        recommendation: true,
        packSize: [
          { packSizeName: "Regular", Price: 180, Prime: false },
          { packSizeName: "Double Egg (Large)", Price: 240, Prime: false },
        ],
      },
      {
        name: "Tandoori Chicken Tikka Kebab",
        slugUrl: "bawarchi-tandoori-chicken-tikka-kalyannagar",
        description: "Boneless chicken cubes marinated in yogurt and tandoori spices, char-grilled to perfection.",
        category: "Kebabs",
        categoryUrl: "kebabs",
        veg: false,
        Nonveg: true,
        menu_types: ["Starters", "Tandoor"],
        status: true,
        OutOfStack: false,
        thumbnail: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800",
        rating: 4.7,
        ratingCount: 460,
        trending: true,
        recommendation: true,
        packSize: [
          { packSizeName: "6 Pieces", Price: 260, Prime: false },
        ],
      },
    ],
  },
];

async function runSeed() {
  try {
    console.log("Connecting to MongoDB:", process.env.DB_URI);
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ MongoDB Connected successfully.");

    for (const item of seedData) {
      const restData = item.restaurant;
      // Check if restaurant already exists by email or mobile or name
      let restaurant = await Restaurant.findOne({
        $or: [{ email: restData.email }, { mobile: restData.mobile }, { name: restData.name }],
      });

      if (restaurant) {
        console.log(`Updating existing restaurant: ${restaurant.name}`);
        Object.assign(restaurant, restData);
        await restaurant.save();
      } else {
        console.log(`Creating new restaurant: ${restData.name}`);
        restaurant = await Restaurant.create(restData);
      }

      console.log(`Restaurant ID: ${restaurant._id}`);

      // Seed products for this restaurant
      for (const prodData of item.products) {
        prodData.restauntId = restaurant._id;
        prodData.restaunt = restaurant.name;

        let product = await Product.findOne({ slugUrl: prodData.slugUrl });
        if (product) {
          console.log(`  Updating product: ${product.name}`);
          Object.assign(product, prodData);
          await product.save();
        } else {
          console.log(`  Creating product: ${prodData.name}`);
          await Product.create(prodData);
        }
      }
    }

    console.log("\n🎉 All 3 Kalyan Nagar Phase Restaurants and Products seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
}

runSeed();
