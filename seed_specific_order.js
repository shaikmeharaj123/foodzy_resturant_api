const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Order = require("./models/OrderModel");

dotenv.config({ path: "config/config.env" });

const targetOrder = {
  _id: new mongoose.Types.ObjectId("6aba1ffaaede2a1c09534ee2"),
  Username: "Shaik",
  userId: "6ab7a3a3cdc6067ea8e92af6",
  Usermobile: 9908018296,
  Useremail: "shaikmeharajhamed2000@gmail.com",
  userAddress: {
    Latitude: "17.444219470395193",
    Longitude: "78.4327356356029",
    address: "203, 203, Street Number 4, Sanjeeva Reddy Nagar, Hyderabad, 500038",
    house_no: "203",
    landmark: "",
    type: "Home",
    prime: false,
  },
  restauntId: "6aba1f2400ff06c1b33bf952",
  restauntName: "Bawarchi Multi Cuisine - Kalyan Nagar Phase",
  restauntmobile: 9999999999,
  restauntemail: "restaurant@fooddelivery.com",
  restauntAddress: "Shop 5 & 6, Kalyan Nagar Phase 1 Venture, SR Nagar Ext, Hyderabad 500038",
  restauntLatitude: "17.4009",
  restauntLongitude: "78.4860",
  DeliveryPersionId: "",
  DeliveryPersionName: "",
  DeliveryPersionmobile: 0,
  DeliveryPersionemail: "",
  DeliveryPersionAddress: "",
  DeliveryPersionLatitude: "",
  DeliveryPersionLongitude: "",
  order_specifications: "",
  status: "preparing",
  order_status: 2,
  payment_mode: "COD",
  total_Amount: 180,
  gst: 9,
  delivery_Charge: 35,
  platform_fee: 5,
  grand_total: 229,
  total_net_payable: 229,
  rain_fee: 0,
  peektime_fee: 0,
  more_distance: 0,
  distance: "2.8 km",
  time_takes: "20 min",
  delivery_tip: 0,
  discount_amount: 0,
  coupon_amount: 0,
  order_mode: "Delivery",
  userpreference: "",
  table_number: "",
  guest_count: 1,
  booking_time: "",
  pickup_time: "",
  restaurent_total_Amount: 0,
  restaurent_gst: 0,
  restaurent_total_net_payable: 0,
  rating: 0,
  partner_order_total_time: 0,
  produucts: [
    {
      productId: "6aba1f2400ff06c1b33bf959",
      name: "Special Egg Dum Biryani",
      slugUrl: "special-egg-dum-biryani",
      description: "Fragrant spiced biryani rice loaded with fried boiled eggs and served with mirchi ka salan and raita.",
      category: "Food",
      categoryUrl: "food",
      thumbnail: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800",
      packId: "6aba1f2400ff06c1b33bf959",
      packSizeName: "Regular",
      Price: 180,
      cartQuentity: 1,
      TotalPrice: 180,
      _id: new mongoose.Types.ObjectId("6aba1ffaaede2a1c09534ee3"),
    },
  ],
  order_expected_date: new Date(),
  createdAt: new Date(),
};

async function seedOrder() {
  try {
    console.log("Connecting to MongoDB:", process.env.DB_URI);
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ MongoDB Connected successfully.");

    await Order.findByIdAndDelete(targetOrder._id);
    const created = await Order.create(targetOrder);

    console.log("🎉 Order seeded successfully!");
    console.log("Order ID:", created._id);
    console.log("Status:", created.status);
    console.log("DeliveryPersionId:", `"${created.DeliveryPersionId}"`);
    console.log("Restaurant:", created.restauntName);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding order:", error);
    process.exit(1);
  }
}

seedOrder();
