/**
 * Complete MongoDB Database Seeding Script
 * Seeds Restaurants, Categories, Products & Coupons with full dynamic data.
 *
 * Run with: node utils/seedDatabase.js
 */

const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../config/config.env") });

const Restaurant = require("../models/RestaurantModel");
const Product = require("../models/ProductModel");
const Category = require("../models/categoryModel");
const Coupon = require("../models/CouponModel");

const DB_URI =
  process.env.DB_URI ||
  "mongodb+srv://dexterouswebsite_db_user:nQ5cOYgSceGjXo1f@cluster0.bauzedu.mongodb.net/fooddelivery?retryWrites=true&w=majority&appName=Cluster0";

const defaultWeeklyTimings = [
  { day: "Monday", startTime: "11:00", startTimeFormate: "AM", endTime: "11:30", endTimeFormate: "PM", staus: true },
  { day: "Tuesday", startTime: "11:00", startTimeFormate: "AM", endTime: "11:30", endTimeFormate: "PM", staus: true },
  { day: "Wednesday", startTime: "11:00", startTimeFormate: "AM", endTime: "11:30", endTimeFormate: "PM", staus: true },
  { day: "Thursday", startTime: "11:00", startTimeFormate: "AM", endTime: "11:30", endTimeFormate: "PM", staus: true },
  { day: "Friday", startTime: "11:00", startTimeFormate: "AM", endTime: "12:00", endTimeFormate: "AM", staus: true },
  { day: "Saturday", startTime: "10:30", startTimeFormate: "AM", endTime: "12:00", endTimeFormate: "AM", staus: true },
  { day: "Sunday", startTime: "10:30", startTimeFormate: "AM", endTime: "11:30", endTimeFormate: "PM", staus: true },
];

const categoriesData = [
  {
    name: "Biryani",
    slugUrl: "biryani",
    mobileImage: "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=500&q=88",
    desktopImage: "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=800&q=88",
    status: true,
  },
  {
    name: "Pizza",
    slugUrl: "pizza",
    mobileImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=88",
    desktopImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=88",
    status: true,
  },
  {
    name: "Burgers",
    slugUrl: "burgers",
    mobileImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=88",
    desktopImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=88",
    status: true,
  },
  {
    name: "South Indian",
    slugUrl: "south-indian",
    mobileImage: "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=500&q=88",
    desktopImage: "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=800&q=88",
    status: true,
  },
  {
    name: "North Indian",
    slugUrl: "north-indian",
    mobileImage: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=88",
    desktopImage: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=88",
    status: true,
  },
  {
    name: "Chinese",
    slugUrl: "chinese",
    mobileImage: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=88",
    desktopImage: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=88",
    status: true,
  },
  {
    name: "Desserts",
    slugUrl: "desserts",
    mobileImage: "https://images.unsplash.com/photo-1551024506-0BCCd828d307?auto=format&fit=crop&w=500&q=88",
    desktopImage: "https://images.unsplash.com/photo-1551024506-0BCCd828d307?auto=format&fit=crop&w=800&q=88",
    status: true,
  },
];

const restaurantsData = [
  {
    name: "Bawarchi Restaurant",
    mobile: 9876543210,
    email: "contact@bawarchihyd.com",
    contact_number: "040-27634455",
    FSSAI_Lic_No: "13622011000123",
    GST: "36AAAAA0000A1Z5",
    Branch: "RTC X Roads, Hyderabad",
    address: "RTC Cross Road, Opposite Sandhya Theatre, Chikkadpally, Hyderabad, Telangana 500020",
    Latitude: "17.4018",
    Longitude: "78.4905",
    logo: "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    ratingCount: 15200,
    Delivery_type: "Delivery",
    open_status: true,
    status: true,
    is_dining_available: true,
    is_pickup_available: true,
    dining_discount: "Flat 20% OFF with Pre-booking",
    dining_timings: "11:30 AM - 11:30 PM",
    dining_features: ["Family Dining", "AC Hall", "Valet Parking", "Halal Certified"],
    cost_for_two: "₹800 for two",
    table_booking_enabled: true,
    pickup_time: "15 mins",
    pickup_discount: "Save 10% Extra on Pickup",
    preparationTiming: "20",
    minDeliveryTiming: "25",
    maxDeliveryTiming: "35",
    categories: ["Biryani", "North Indian", "Kebabs", "Chinese", "Desserts"],
    open_timings: defaultWeeklyTimings,
    products: [
      {
        name: "Special Chicken Dum Biryani",
        slugUrl: "bawarchi-special-chicken-dum-biryani",
        description: "Signature slow-cooked aromatic basmati rice layered with succulent chicken and secret spices, served with Mirchi Ka Salan and Raita.",
        category: "Biryani",
        categoryUrl: "biryani",
        veg: false,
        Nonveg: true,
        menu_types: ["Main Course"],
        status: true,
        trending: true,
        recommendation: true,
        rating: 4.8,
        ratingCount: 12500,
        thumbnail: "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=800",
        packSize: [
          { packSizeName: "Single", Price: 220, Prime: false },
          { packSizeName: "Full (2 Persons)", Price: 380, Prime: true },
          { packSizeName: "Family Pack", Price: 720, Prime: false },
        ],
      },
      {
        name: "Mutton Dum Biryani",
        slugUrl: "bawarchi-mutton-dum-biryani",
        description: "Tender goat meat infused with rich spices and saffron layered basmati rice.",
        category: "Biryani",
        categoryUrl: "biryani",
        veg: false,
        Nonveg: true,
        menu_types: ["Main Course"],
        status: true,
        trending: true,
        recommendation: true,
        rating: 4.9,
        ratingCount: 9800,
        thumbnail: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800",
        packSize: [
          { packSizeName: "Single", Price: 290, Prime: false },
          { packSizeName: "Full", Price: 460, Prime: true },
        ],
      },
      {
        name: "Chicken 65",
        slugUrl: "bawarchi-chicken-65",
        description: "Crispy fried chicken chunks tossed in spicy yogurt tempering with curry leaves and green chilies.",
        category: "Kebabs",
        categoryUrl: "kebabs",
        veg: false,
        Nonveg: true,
        menu_types: ["Starters"],
        status: true,
        trending: true,
        recommendation: false,
        rating: 4.6,
        ratingCount: 4200,
        thumbnail: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800",
        packSize: [
          { packSizeName: "Regular", Price: 260, Prime: true },
        ],
      },
      {
        name: "Butter Paneer Masala",
        slugUrl: "bawarchi-butter-paneer-masala",
        description: "Cottage cheese cubes simmered in a rich, buttery and creamy tomato-cashew gravy.",
        category: "North Indian",
        categoryUrl: "north-indian",
        veg: true,
        Nonveg: false,
        menu_types: ["Main Course"],
        status: true,
        trending: false,
        recommendation: true,
        rating: 4.5,
        ratingCount: 3100,
        thumbnail: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
        packSize: [
          { packSizeName: "Full", Price: 240, Prime: true },
        ],
      },
    ],
  },
  {
    name: "The Glasshouse Rooftop Lounge",
    mobile: 9876543211,
    email: "reservations@glasshouselounge.com",
    contact_number: "040-44556677",
    FSSAI_Lic_No: "13622011000456",
    GST: "36BBBBB1111B2Z6",
    Branch: "Jubilee Hills, Hyderabad",
    address: "Road No 36, Near Peddamma Temple, Jubilee Hills, Hyderabad 500033",
    Latitude: "17.4325",
    Longitude: "78.4071",
    logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 3400,
    Delivery_type: "Delivery",
    open_status: true,
    status: true,
    is_dining_available: true,
    is_pickup_available: true,
    dining_discount: "Flat 25% OFF with Pre-booking",
    dining_timings: "12:00 PM - 12:00 AM",
    dining_features: ["Rooftop", "Live Music", "Full Bar", "Valet Parking", "Lake View"],
    cost_for_two: "₹1,600 for two",
    table_booking_enabled: true,
    pickup_time: "20 mins",
    pickup_discount: "Extra 15% OFF on Pickup",
    preparationTiming: "25",
    minDeliveryTiming: "30",
    maxDeliveryTiming: "45",
    categories: ["Continental", "Italian", "Cocktails", "Gourmet", "Desserts"],
    open_timings: defaultWeeklyTimings,
    products: [
      {
        name: "Woodfired Truffle Mushroom Pizza",
        slugUrl: "glasshouse-woodfired-truffle-mushroom-pizza",
        description: "Hand-stretched sourdough pizza topped with wild mushrooms, mozzarella, parmesan and aromatic truffle oil drizzle.",
        category: "Italian",
        categoryUrl: "italian",
        veg: true,
        Nonveg: false,
        menu_types: ["Main Course"],
        status: true,
        trending: true,
        recommendation: true,
        rating: 4.9,
        ratingCount: 1800,
        thumbnail: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
        packSize: [
          { packSizeName: "11 inch", Price: 480, Prime: true },
        ],
      },
      {
        name: "Grilled Peri Peri Chicken Steak",
        slugUrl: "glasshouse-grilled-peri-peri-chicken-steak",
        description: "Juicy marinated chicken breast flame-grilled to perfection, served with herb mash, sauteed butter veggies and pepper jus.",
        category: "Continental",
        categoryUrl: "continental",
        veg: false,
        Nonveg: true,
        menu_types: ["Main Course"],
        status: true,
        trending: true,
        recommendation: true,
        rating: 4.7,
        ratingCount: 2200,
        thumbnail: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",
        packSize: [
          { packSizeName: "Full Portion", Price: 520, Prime: true },
        ],
      },
    ],
  },
  {
    name: "Barbeque Nation Buffet",
    mobile: 9876543212,
    email: "banjara@bbqnation.com",
    contact_number: "040-33445566",
    FSSAI_Lic_No: "13622011000789",
    GST: "36CCCCC2222C3Z7",
    Branch: "Banjara Hills, Hyderabad",
    address: "ANR Center, Road No 1, Banjara Hills, Hyderabad, Telangana 500034",
    Latitude: "17.4156",
    Longitude: "78.4347",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    ratingCount: 8900,
    Delivery_type: "Delivery",
    open_status: true,
    status: true,
    is_dining_available: true,
    is_pickup_available: true,
    dining_discount: "Flat 15% OFF on Buffet Pay",
    dining_timings: "12:00 PM - 11:00 PM",
    dining_features: ["Unlimited Buffet", "Live Grill", "Family Dining", "AC", "Dessert Counter"],
    cost_for_two: "₹1,400 for two",
    table_booking_enabled: true,
    pickup_time: "15 mins",
    pickup_discount: "Save 10% Extra on Pickup",
    preparationTiming: "20",
    minDeliveryTiming: "25",
    maxDeliveryTiming: "35",
    categories: ["Buffet", "BBQ", "North Indian", "Desserts"],
    open_timings: defaultWeeklyTimings,
    products: [
      {
        name: "Barbeque Box - Non Veg",
        slugUrl: "bbq-nation-non-veg-box",
        description: "Assorted feast including Chicken Tikka, Fish Fry, Chicken Biryani, Mutton Curry, Angoori Gulab Jamun & Brownie.",
        category: "BBQ",
        categoryUrl: "bbq",
        veg: false,
        Nonveg: true,
        menu_types: ["Buffet Box"],
        status: true,
        trending: true,
        recommendation: true,
        rating: 4.7,
        ratingCount: 4500,
        thumbnail: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
        packSize: [
          { packSizeName: "Standard Box", Price: 799, Prime: true },
        ],
      },
    ],
  },
  {
    name: "Olive Bistro & Bar",
    mobile: 9876543213,
    email: "olive@bistroid.com",
    contact_number: "040-66778899",
    FSSAI_Lic_No: "13622011000999",
    GST: "36DDDDD3333D4Z8",
    Branch: "Durgam Cheruvu, Hyderabad",
    address: "Road 46, Jubilee Hills, Hyderabad 500033",
    Latitude: "17.4350",
    Longitude: "78.3880",
    logo: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    ratingCount: 4100,
    Delivery_type: "Delivery",
    open_status: true,
    status: true,
    is_dining_available: true,
    is_pickup_available: true,
    dining_discount: "Up to 30% OFF on Dine-in",
    dining_timings: "11:30 AM - 11:30 PM",
    dining_features: ["Lake View", "Romantic Ambience", "Outdoor Seating", "AC"],
    cost_for_two: "₹2,200 for two",
    table_booking_enabled: true,
    pickup_time: "20 mins",
    pickup_discount: "Save 10% Extra on Pickup",
    preparationTiming: "20",
    minDeliveryTiming: "30",
    maxDeliveryTiming: "40",
    categories: ["Italian", "European", "Desserts"],
    open_timings: defaultWeeklyTimings,
    products: [
      {
        name: "Classic Tiramisu",
        slugUrl: "olive-classic-tiramisu",
        description: "Espresso soaked ladyfingers layered with mascarpone cream and dusted with rich cocoa.",
        category: "Desserts",
        categoryUrl: "desserts",
        veg: true,
        Nonveg: false,
        menu_types: ["Dessert"],
        status: true,
        trending: true,
        recommendation: true,
        rating: 4.9,
        ratingCount: 1500,
        thumbnail: "https://images.unsplash.com/photo-1551024506-0BCCd828d307?w=800",
        packSize: [
          { packSizeName: "Portion", Price: 320, Prime: true },
        ],
      },
    ],
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(DB_URI);
    console.log("Connected successfully to MongoDB!");

    // 1. Seed Categories
    console.log("\n--- Seeding Categories ---");
    for (const catData of categoriesData) {
      let cat = await Category.findOne({ slugUrl: catData.slugUrl });
      if (cat) {
        await Category.findByIdAndUpdate(cat._id, catData, { new: true });
        console.log(`Updated Category: ${catData.name}`);
      } else {
        await Category.create(catData);
        console.log(`Created Category: ${catData.name}`);
      }
    }

    // 2. Seed Restaurants & Products
    console.log("\n--- Seeding Restaurants & Products ---");
    for (const restData of restaurantsData) {
      const { products, ...restFields } = restData;

      let restaurant = await Restaurant.findOne({ name: restFields.name });
      if (restaurant) {
        restaurant = await Restaurant.findByIdAndUpdate(restaurant._id, restFields, {
          new: true,
          runValidators: true,
        });
        console.log(`Updated Restaurant: ${restaurant.name}`);
      } else {
        restaurant = await Restaurant.create(restFields);
        console.log(`Created Restaurant: ${restaurant.name}`);
      }

      if (Array.isArray(products)) {
        for (const prodData of products) {
          const productPayload = {
            ...prodData,
            restauntId: restaurant._id,
            restaunt: restaurant.name,
          };

          let prod = await Product.findOne({ slugUrl: prodData.slugUrl });
          if (prod) {
            await Product.findByIdAndUpdate(prod._id, productPayload, {
              new: true,
              runValidators: true,
            });
            console.log(`  Updated Product: ${prodData.name}`);
          } else {
            await Product.create(productPayload);
            console.log(`  Created Product: ${prodData.name}`);
          }
        }
      }
    }

    console.log("\n==================================================");
    console.log("Database seeded successfully with all dynamic data!");
    console.log("==================================================");
    process.exit(0);
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
