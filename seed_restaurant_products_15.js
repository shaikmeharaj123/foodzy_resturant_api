const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Restaurant = require("./models/RestaurantModel");
const Product = require("./models/ProductModel");

dotenv.config({ path: "config/config.env" });

// Helper to create clean slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// Comprehensive catalog of authentic, diverse menu items with valid images
const CATALOG = {
  // BIRYANI & HYDERABADI & MUGHLAI SPECIALS
  biryani_mughlai: [
    {
      name: "Hyderabadi Chicken Dum Biryani",
      description: "Fragrant long-grain basmati rice cooked on dum with succulent chicken pieces, saffron, mint and authentic spices.",
      category: "Biryani",
      categoryUrl: "biryani",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Biryani"],
      thumbnail: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
      rating: 4.8,
      ratingCount: 380,
      trending: true,
      recommendation: true,
      packSize: [
        { packSizeName: "Single", Price: 240, Prime: false },
        { packSizeName: "Full (2-3 Persons)", Price: 420, Prime: false },
      ],
    },
    {
      name: "Special Mutton Dum Biryani",
      description: "Tender pieces of fresh goat meat marinated in rich yogurt spices, slow-cooked in layered dum basmati rice.",
      category: "Biryani",
      categoryUrl: "biryani",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Biryani"],
      thumbnail: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800",
      rating: 4.9,
      ratingCount: 420,
      trending: true,
      recommendation: true,
      packSize: [
        { packSizeName: "Regular", Price: 340, Prime: false },
        { packSizeName: "Jumbo Pack", Price: 680, Prime: false },
      ],
    },
    {
      name: "Chicken 65 (Hyderabadi Style)",
      description: "Crispy fried boneless chicken tossed with spicy red chilli sauce, curry leaves, ginger and green chillies.",
      category: "Starters",
      categoryUrl: "starters",
      veg: false,
      Nonveg: true,
      menu_types: ["Starters", "Snacks"],
      thumbnail: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800",
      rating: 4.7,
      ratingCount: 290,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Standard (8 Pcs)", Price: 260, Prime: false }],
    },
    {
      name: "Tandoori Chicken Half",
      description: "Whole chicken leg and breast marinated in spiced yogurt, smoked to charred perfection in charcoal tandoor.",
      category: "Starters",
      categoryUrl: "starters",
      veg: false,
      Nonveg: true,
      menu_types: ["Starters", "Tandoor"],
      thumbnail: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800",
      rating: 4.6,
      ratingCount: 310,
      trending: false,
      recommendation: true,
      packSize: [
        { packSizeName: "Half (4 Pcs)", Price: 270, Prime: false },
        { packSizeName: "Full (8 Pcs)", Price: 490, Prime: false },
      ],
    },
    {
      name: "Butter Chicken Masala",
      description: "Tandoor roasted boneless chicken tikka simmered in creamy satin-smooth tomato, cashew and butter makhani gravy.",
      category: "North Indian",
      categoryUrl: "north-indian",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Curries"],
      thumbnail: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800",
      rating: 4.8,
      ratingCount: 340,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Portion (500ml)", Price: 290, Prime: false }],
    },
    {
      name: "Mutton Rogan Josh",
      description: "Kashmiri style aromatic curry of succulent mutton simmered in rich Kashmiri red chilli, fennel and ginger gravy.",
      category: "Mughlai",
      categoryUrl: "mughlai",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Curries"],
      thumbnail: "https://images.unsplash.com/photo-1545247181-516773cae7be?w=800",
      rating: 4.7,
      ratingCount: 190,
      trending: false,
      recommendation: false,
      packSize: [{ packSizeName: "Standard", Price: 360, Prime: false }],
    },
    {
      name: "Butter Garlic Naan (2 Pcs)",
      description: "Leavened flatbread freshly baked in tandoor, topped with roasted garlic and rich melted butter.",
      category: "Breads",
      categoryUrl: "breads",
      veg: true,
      Nonveg: false,
      menu_types: ["Breads"],
      thumbnail: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800",
      rating: 4.6,
      ratingCount: 220,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "2 Pcs", Price: 90, Prime: false }],
    },
    {
      name: "Rumali Roti (3 Pcs)",
      description: "Ultra-thin, soft handkerchief-style Indian bread cooked over an inverted tawa.",
      category: "Breads",
      categoryUrl: "breads",
      veg: true,
      Nonveg: false,
      menu_types: ["Breads"],
      thumbnail: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800",
      rating: 4.4,
      ratingCount: 150,
      trending: false,
      recommendation: false,
      packSize: [{ packSizeName: "3 Pcs", Price: 75, Prime: false }],
    },
    {
      name: "Paneer Butter Masala",
      description: "Cubes of fresh cottage cheese tossed in a mildly spiced, velvety tomato-butter gravy with kasuri methi.",
      category: "North Indian",
      categoryUrl: "north-indian",
      veg: true,
      Nonveg: false,
      menu_types: ["Main Course", "Curries"],
      thumbnail: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
      rating: 4.7,
      ratingCount: 260,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Standard Bowl", Price: 250, Prime: false }],
    },
    {
      name: "Dal Makhani (Desi Ghee)",
      description: "Black lentils and kidney beans slow-cooked overnight with churned butter and dairy cream.",
      category: "North Indian",
      categoryUrl: "north-indian",
      veg: true,
      Nonveg: false,
      menu_types: ["Main Course", "Curries"],
      thumbnail: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
      rating: 4.8,
      ratingCount: 310,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Standard (400ml)", Price: 210, Prime: false }],
    },
    {
      name: "Tandoori Chicken Tikka (6 Pcs)",
      description: "Juicy boneless chicken morsels marinated in spiced yogurt, char-grilled with capsicum and onions.",
      category: "Starters",
      categoryUrl: "starters",
      veg: false,
      Nonveg: true,
      menu_types: ["Starters", "Tandoor"],
      thumbnail: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800",
      rating: 4.7,
      ratingCount: 230,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Plate (6 Pcs)", Price: 280, Prime: false }],
    },
    {
      name: "Hyderabadi Veg Dum Biryani",
      description: "Garden fresh carrots, beans, cauliflower and paneer slow cooked with fragrant basmati and whole spices.",
      category: "Biryani",
      categoryUrl: "biryani",
      veg: true,
      Nonveg: false,
      menu_types: ["Main Course", "Biryani"],
      thumbnail: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
      rating: 4.5,
      ratingCount: 190,
      trending: false,
      recommendation: false,
      packSize: [{ packSizeName: "Regular", Price: 210, Prime: false }],
    },
    {
      name: "Chicken Seekh Kebab (4 Pcs)",
      description: "Minced chicken blended with herbs, green chillies and garam masala, grilled on skewers.",
      category: "Starters",
      categoryUrl: "starters",
      veg: false,
      Nonveg: true,
      menu_types: ["Starters"],
      thumbnail: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
      rating: 4.6,
      ratingCount: 175,
      trending: false,
      recommendation: false,
      packSize: [{ packSizeName: "4 Pcs", Price: 270, Prime: false }],
    },
    {
      name: "Double Ka Meetha",
      description: "Traditional Hyderabadi dessert of crispy fried bread soaked in saffron infused cardamom rabri and dry fruits.",
      category: "Desserts",
      categoryUrl: "desserts",
      veg: true,
      Nonveg: false,
      menu_types: ["Desserts"],
      thumbnail: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800",
      rating: 4.8,
      ratingCount: 310,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Single Cup (150g)", Price: 110, Prime: false }],
    },
    {
      name: "Qubani Ka Meetha with Ice Cream",
      description: "Stewed dried apricots flavored with rose water, topped with a scoop of vanilla ice cream and apricot kernels.",
      category: "Desserts",
      categoryUrl: "desserts",
      veg: true,
      Nonveg: false,
      menu_types: ["Desserts"],
      thumbnail: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800",
      rating: 4.9,
      ratingCount: 260,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Portion", Price: 140, Prime: false }],
    },
    {
      name: "Gulab Jamun (2 Pcs)",
      description: "Soft melt-in-mouth milk solid dumplings fried to golden brown and steeped in warm cardamom sugar syrup.",
      category: "Desserts",
      categoryUrl: "desserts",
      veg: true,
      Nonveg: false,
      menu_types: ["Desserts"],
      thumbnail: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800",
      rating: 4.7,
      ratingCount: 190,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "2 Pcs Warm", Price: 80, Prime: false }],
    },
    {
      name: "Special Sweet Lassi",
      description: "Thick chilled yogurt blended with sugar, cardamom, topped with thick malai and chopped pistachios.",
      category: "Beverages",
      categoryUrl: "beverages",
      veg: true,
      Nonveg: false,
      menu_types: ["Beverages"],
      thumbnail: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=800",
      rating: 4.7,
      ratingCount: 160,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Glass (350ml)", Price: 90, Prime: false }],
    },
  ],

  // PIZZA, PASTA & ITALIAN
  pizza_italian: [
    {
      name: "Farmhouse Fresh Veggie Pizza",
      description: "Loaded with fresh bell peppers, crisp onions, ripe tomatoes, sliced mushrooms and mozzarella cheese.",
      category: "Pizza",
      categoryUrl: "pizza",
      veg: true,
      Nonveg: false,
      menu_types: ["Main Course", "Pizza"],
      thumbnail: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
      rating: 4.8,
      ratingCount: 410,
      trending: true,
      recommendation: true,
      packSize: [
        { packSizeName: "Regular (7 inch)", Price: 220, Prime: false },
        { packSizeName: "Medium (10 inch)", Price: 390, Prime: false },
      ],
    },
    {
      name: "Pepperoni & Spiced Chicken Pizza",
      description: "Classic Italian crust topped with zesty chicken pepperoni, spicy chicken chunks and melted mozzarella.",
      category: "Pizza",
      categoryUrl: "pizza",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Pizza"],
      thumbnail: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800",
      rating: 4.9,
      ratingCount: 460,
      trending: true,
      recommendation: true,
      packSize: [
        { packSizeName: "Medium (10 inch)", Price: 460, Prime: false },
        { packSizeName: "Large (12 inch)", Price: 680, Prime: false },
      ],
    },
    {
      name: "Margherita Supreme Cheesy Pizza",
      description: "100% real mozzarella cheese layered with Italian san marzano herb tomato sauce and fresh basil.",
      category: "Pizza",
      categoryUrl: "pizza",
      veg: true,
      Nonveg: false,
      menu_types: ["Main Course", "Pizza"],
      thumbnail: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
      rating: 4.7,
      ratingCount: 350,
      trending: false,
      recommendation: true,
      packSize: [
        { packSizeName: "Regular (7 inch)", Price: 170, Prime: false },
        { packSizeName: "Medium (10 inch)", Price: 310, Prime: false },
      ],
    },
    {
      name: "Fiery Peri Peri Chicken Pizza",
      description: "Spicy peri peri marinated chicken chunks, red paprika, jalapenos, and grilled onions on hand-tossed crust.",
      category: "Pizza",
      categoryUrl: "pizza",
      veg: false,
      Nonveg: true,
      menu_types: ["Pizza"],
      thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
      rating: 4.8,
      ratingCount: 310,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Medium (10 inch)", Price: 440, Prime: false }],
    },
    {
      name: "Stuffed Garlic Breadsticks with Dip",
      description: "Freshly baked garlic bread filled with melted mozzarella, sweet corn and spicy jalapenos served with creamy dip.",
      category: "Fast Food",
      categoryUrl: "fast-food",
      veg: true,
      Nonveg: false,
      menu_types: ["Starters", "Snacks"],
      thumbnail: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800",
      rating: 4.8,
      ratingCount: 380,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "1 Portion (4 Pcs)", Price: 150, Prime: false }],
    },
    {
      name: "Creamy Alfredo White Sauce Pasta",
      description: "Penne pasta tossed in rich parmesan cream cheese sauce with sliced mushrooms and Italian herbs.",
      category: "Continental",
      categoryUrl: "continental",
      veg: true,
      Nonveg: false,
      menu_types: ["Main Course", "Pasta"],
      thumbnail: "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=800",
      rating: 4.6,
      ratingCount: 220,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Bowl (450g)", Price: 260, Prime: false }],
    },
    {
      name: "Spicy Arrabbiata Red Sauce Pasta",
      description: "Al dente penne simmered in a robust, spicy garlic and crushed tomato sauce with kalamata olives and basil.",
      category: "Continental",
      categoryUrl: "continental",
      veg: true,
      Nonveg: false,
      menu_types: ["Pasta"],
      thumbnail: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",
      rating: 4.5,
      ratingCount: 180,
      trending: false,
      recommendation: false,
      packSize: [{ packSizeName: "Bowl (450g)", Price: 240, Prime: false }],
    },
    {
      name: "Baked Cheesy Macaroni & Cheese",
      description: "Tender macaroni smothered in a golden 3-cheese blend and baked with a crunchy herb crust.",
      category: "Continental",
      categoryUrl: "continental",
      veg: true,
      Nonveg: false,
      menu_types: ["Main Course"],
      thumbnail: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800",
      rating: 4.7,
      ratingCount: 195,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Bowl", Price: 270, Prime: false }],
    },
    {
      name: "Choco Lava Cake",
      description: "Decadent warm chocolate cake with a molten chocolate center that oozes with every bite.",
      category: "Desserts",
      categoryUrl: "desserts",
      veg: true,
      Nonveg: false,
      menu_types: ["Desserts"],
      thumbnail: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800",
      rating: 4.9,
      ratingCount: 520,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Single Cup", Price: 110, Prime: false }],
    },
    {
      name: "Crispy Peri Peri Potato Wedges",
      description: "Thick cut skin-on potato wedges fried golden and dusted in fiery peri-peri seasoning.",
      category: "Fast Food",
      categoryUrl: "fast-food",
      veg: true,
      Nonveg: false,
      menu_types: ["Snacks"],
      thumbnail: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800",
      rating: 4.5,
      ratingCount: 160,
      trending: false,
      recommendation: false,
      packSize: [{ packSizeName: "Large Box", Price: 130, Prime: false }],
    },
    {
      name: "Classic Virgin Mojito",
      description: "Refreshing sparkling beverage with muddled fresh mint leaves, zesty lime and crushed ice.",
      category: "Beverages",
      categoryUrl: "beverages",
      veg: true,
      Nonveg: false,
      menu_types: ["Beverages"],
      thumbnail: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800",
      rating: 4.6,
      ratingCount: 140,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "350ml Can", Price: 120, Prime: false }],
    },
    {
      name: "Iced Hazelnut Cold Coffee",
      description: "Smooth espresso brewed coffee blended with hazelnut syrup, chilled milk and vanilla cream.",
      category: "Beverages",
      categoryUrl: "beverages",
      veg: true,
      Nonveg: false,
      menu_types: ["Beverages"],
      thumbnail: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800",
      rating: 4.8,
      ratingCount: 220,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "350ml Cup", Price: 140, Prime: false }],
    },
  ],

  // BURGERS, FAST FOOD & ROLLS
  fast_food_burgers: [
    {
      name: "Crispy Zinger Chicken Burger",
      description: "Signature crunchy fried chicken fillet with spicy mayonnaise and fresh iceberg lettuce in sesame brioche bun.",
      category: "Burgers",
      categoryUrl: "burgers",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Burgers"],
      thumbnail: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      rating: 4.8,
      ratingCount: 490,
      trending: true,
      recommendation: true,
      packSize: [
        { packSizeName: "Single Burger", Price: 180, Prime: false },
        { packSizeName: "Combo (Fries + Drink)", Price: 290, Prime: false },
      ],
    },
    {
      name: "Double Patty Veggie Supreme Burger",
      description: "Two crispy golden vegetable patties topped with melted cheddar, pickled gherkins, onions and creamy thousand island sauce.",
      category: "Burgers",
      categoryUrl: "burgers",
      veg: true,
      Nonveg: false,
      menu_types: ["Burgers"],
      thumbnail: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",
      rating: 4.6,
      ratingCount: 280,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Regular", Price: 160, Prime: false }],
    },
    {
      name: "Hot & Crispy Fried Chicken (4 Pcs)",
      description: "Fresh chicken pieces double-breaded in 11 secret herbs and spices, pressure-fried to golden crunchiness.",
      category: "Fast Food",
      categoryUrl: "fast-food",
      veg: false,
      Nonveg: true,
      menu_types: ["Starters", "Snacks"],
      thumbnail: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800",
      rating: 4.9,
      ratingCount: 510,
      trending: true,
      recommendation: true,
      packSize: [
        { packSizeName: "4 Pcs Bucket", Price: 340, Prime: false },
        { packSizeName: "8 Pcs Bucket", Price: 620, Prime: false },
      ],
    },
    {
      name: "Crispy Chicken Popcorn",
      description: "Bite-sized tender boneless chicken nuggets with crunchy coating, served with sweet chilli dip.",
      category: "Fast Food",
      categoryUrl: "fast-food",
      veg: false,
      Nonveg: true,
      menu_types: ["Snacks"],
      thumbnail: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800",
      rating: 4.7,
      ratingCount: 320,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Medium Box", Price: 190, Prime: false }],
    },
    {
      name: "Double Egg Chicken Kathi Roll",
      description: "Flaky paratha layered with two beaten eggs, stuffed with spicy chicken tikka, sliced onions and mint chutney.",
      category: "Rolls",
      categoryUrl: "rolls",
      veg: false,
      Nonveg: true,
      menu_types: ["Snacks", "Rolls"],
      thumbnail: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
      rating: 4.8,
      ratingCount: 360,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "1 Jumbo Roll", Price: 170, Prime: false }],
    },
    {
      name: "Paneer Tikka Kathi Roll",
      description: "Charcoal grilled paneer cubes wrapped in a toasted paratha with tangy salsa and mint mayonnaise.",
      category: "Rolls",
      categoryUrl: "rolls",
      veg: true,
      Nonveg: false,
      menu_types: ["Rolls"],
      thumbnail: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
      rating: 4.6,
      ratingCount: 210,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "1 Roll", Price: 150, Prime: false }],
    },
    {
      name: "Cheesy Loaded French Fries",
      description: "Crispy golden salted fries smothered in melted cheddar cheese sauce, jalapenos and chilli flakes.",
      category: "Fast Food",
      categoryUrl: "fast-food",
      veg: true,
      Nonveg: false,
      menu_types: ["Snacks"],
      thumbnail: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800",
      rating: 4.7,
      ratingCount: 290,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Large Box", Price: 160, Prime: false }],
    },
    {
      name: "Thick Chocolate Oreo Shake",
      description: "Rich chocolate milkshake blended with crushed Oreo biscuits, vanilla soft serve and chocolate drizzle.",
      category: "Beverages",
      categoryUrl: "beverages",
      veg: true,
      Nonveg: false,
      menu_types: ["Beverages"],
      thumbnail: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800",
      rating: 4.8,
      ratingCount: 240,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Cup (350ml)", Price: 140, Prime: false }],
    },
  ],

  // SOUTH INDIAN & COASTAL
  south_indian: [
    {
      name: "Ghee Roast Masala Dosa",
      description: "Golden crisp crepe roasted in pure desi ghee, filled with spiced mashed potato bhaji, served with 3 chutneys & sambar.",
      category: "South Indian",
      categoryUrl: "south-indian",
      veg: true,
      Nonveg: false,
      menu_types: ["Breakfast", "Main Course"],
      thumbnail: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800",
      rating: 4.9,
      ratingCount: 510,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Standard", Price: 130, Prime: false }],
    },
    {
      name: "Steamed Idli (3 Pcs) with Vada",
      description: "Soft fluffy steamed rice cakes with a crispy medu vada, accompanied by hot piping drumstick sambar.",
      category: "South Indian",
      categoryUrl: "south-indian",
      veg: true,
      Nonveg: false,
      menu_types: ["Breakfast"],
      thumbnail: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
      rating: 4.8,
      ratingCount: 390,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Combo (2 Idli + 1 Vada)", Price: 110, Prime: false }],
    },
    {
      name: "Mysore Masala Dosa",
      description: "Crispy dosa smeared with spicy red garlic-chilli chutney and stuffed with spiced potato masala.",
      category: "South Indian",
      categoryUrl: "south-indian",
      veg: true,
      Nonveg: false,
      menu_types: ["South Indian"],
      thumbnail: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800",
      rating: 4.8,
      ratingCount: 340,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Standard", Price: 140, Prime: false }],
    },
    {
      name: "Andhra Guntur Chicken Fry",
      description: "Fiery spicy chicken roasted with Guntur red chillies, crushed garlic, curry leaves and roasted coriander.",
      category: "Starters",
      categoryUrl: "starters",
      veg: false,
      Nonveg: true,
      menu_types: ["Starters"],
      thumbnail: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800",
      rating: 4.9,
      ratingCount: 420,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Plate", Price: 290, Prime: false }],
    },
    {
      name: "Gongura Mutton Curry",
      description: "Traditional Andhra delicacy of tender mutton cooked in tangy sour sorrel (gongura) leaves and green chillies.",
      category: "South Indian",
      categoryUrl: "south-indian",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Curries"],
      thumbnail: "https://images.unsplash.com/photo-1545247181-516773cae7be?w=800",
      rating: 4.9,
      ratingCount: 360,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Bowl (450g)", Price: 380, Prime: false }],
    },
    {
      name: "Curd Rice with Pomegranate & Tadka",
      description: "Comforting creamy yogurt rice tempered with mustard seeds, curry leaves, ginger and juicy pomegranate seeds.",
      category: "South Indian",
      categoryUrl: "south-indian",
      veg: true,
      Nonveg: false,
      menu_types: ["Main Course"],
      thumbnail: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800",
      rating: 4.6,
      ratingCount: 220,
      trending: false,
      recommendation: false,
      packSize: [{ packSizeName: "Bowl", Price: 130, Prime: false }],
    },
    {
      name: "Authentic Filter Coffee",
      description: "Traditional South Indian chicory blend coffee frothed hot with boiled milk in brass dabarah set.",
      category: "Beverages",
      categoryUrl: "beverages",
      veg: true,
      Nonveg: false,
      menu_types: ["Beverages"],
      thumbnail: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800",
      rating: 4.9,
      ratingCount: 480,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Cup (200ml)", Price: 50, Prime: false }],
    },
  ],

  // CHINESE & ASIAN SPECIALS
  chinese_asian: [
    {
      name: "Chicken Hakka Noodles",
      description: "Wok-tossed noodles with shredded chicken, crunchy cabbage, spring onions, capsicum and light soy sauce.",
      category: "Chinese",
      categoryUrl: "chinese",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Chinese"],
      thumbnail: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800",
      rating: 4.7,
      ratingCount: 340,
      trending: true,
      recommendation: true,
      packSize: [
        { packSizeName: "Regular", Price: 210, Prime: false },
        { packSizeName: "Family", Price: 360, Prime: false },
      ],
    },
    {
      name: "Schezwan Chicken Fried Rice",
      description: "Fiery wok-fried basmati rice with chicken bits, egg and homemade spicy Schezwan pepper sauce.",
      category: "Chinese",
      categoryUrl: "chinese",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Chinese"],
      thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
      rating: 4.8,
      ratingCount: 370,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "Box (500g)", Price: 230, Prime: false }],
    },
    {
      name: "Veg Manchurian Dry (8 Pcs)",
      description: "Crispy fried vegetable balls tossed with ginger, garlic, chopped coriander and dark soy sauce.",
      category: "Chinese",
      categoryUrl: "chinese",
      veg: true,
      Nonveg: false,
      menu_types: ["Starters", "Chinese"],
      thumbnail: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800",
      rating: 4.6,
      ratingCount: 240,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Plate (8 Pcs)", Price: 190, Prime: false }],
    },
    {
      name: "Steamed Chicken Momos (6 Pcs)",
      description: "Soft thin-skin dumplings stuffed with seasoned minced chicken, served with spicy red chutney.",
      category: "Chinese",
      categoryUrl: "chinese",
      veg: false,
      Nonveg: true,
      menu_types: ["Starters", "Snacks"],
      thumbnail: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=800",
      rating: 4.8,
      ratingCount: 390,
      trending: true,
      recommendation: true,
      packSize: [{ packSizeName: "6 Pcs Steamed", Price: 160, Prime: false }],
    },
    {
      name: "Chilli Chicken Gravy",
      description: "Classic Indo-Chinese batter-fried chicken chunks in savoury garlic, soya and green chilli sauce.",
      category: "Chinese",
      categoryUrl: "chinese",
      veg: false,
      Nonveg: true,
      menu_types: ["Main Course", "Chinese"],
      thumbnail: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800",
      rating: 4.7,
      ratingCount: 290,
      trending: false,
      recommendation: true,
      packSize: [{ packSizeName: "Bowl (450ml)", Price: 250, Prime: false }],
    },
  ],
};

// Flatten catalog for fallback variety
const ALL_CATALOG_ITEMS = [
  ...CATALOG.biryani_mughlai,
  ...CATALOG.pizza_italian,
  ...CATALOG.fast_food_burgers,
  ...CATALOG.south_indian,
  ...CATALOG.chinese_asian,
];

async function seedRestaurantProducts() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB successfully.");

    const restaurants = await Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants to evaluate.`);

    let totalAdded = 0;

    for (const rest of restaurants) {
      const existingProducts = await Product.find({ restauntId: rest._id });
      const currentCount = existingProducts.length;

      console.log(`\nChecking: "${rest.name}" (ID: ${rest._id}) - Currently has ${currentCount} products.`);

      if (currentCount >= 15) {
        console.log(`  -> Already has ${currentCount} products (>= 15). No need to add.`);
        continue;
      }

      const needed = 15 - currentCount;
      console.log(`  -> Needs ${needed} more products to reach minimum 15.`);

      // Existing product names in lowercase for duplicate prevention
      const existingNames = new Set(existingProducts.map((p) => p.name.trim().toLowerCase()));

      // Pick relevant category list based on restaurant tags and name
      const restCategoriesLower = (rest.categories || []).map((c) => c.toLowerCase());
      const restNameLower = rest.name.toLowerCase();

      let candidatePool = [];

      if (
        restNameLower.includes("pizza") ||
        restNameLower.includes("domino") ||
        restCategoriesLower.includes("pizza") ||
        restCategoriesLower.includes("italian")
      ) {
        candidatePool = [
          ...CATALOG.pizza_italian,
          ...CATALOG.fast_food_burgers,
          ...CATALOG.biryani_mughlai.filter((i) => i.category === "Desserts" || i.category === "Beverages"),
        ];
      } else if (
        restNameLower.includes("kfc") ||
        restNameLower.includes("burger") ||
        restCategoriesLower.includes("burgers")
      ) {
        candidatePool = [
          ...CATALOG.fast_food_burgers,
          ...CATALOG.pizza_italian,
          ...CATALOG.chinese_asian,
        ];
      } else if (
        restNameLower.includes("chutney") ||
        restNameLower.includes("minerva") ||
        restNameLower.includes("ruchulu") ||
        restNameLower.includes("wharf") ||
        restCategoriesLower.includes("south indian")
      ) {
        candidatePool = [
          ...CATALOG.south_indian,
          ...CATALOG.biryani_mughlai,
          ...CATALOG.chinese_asian,
        ];
      } else if (
        restNameLower.includes("nanking") ||
        restNameLower.includes("haiku") ||
        restCategoriesLower.includes("chinese")
      ) {
        candidatePool = [
          ...CATALOG.chinese_asian,
          ...CATALOG.biryani_mughlai,
          ...CATALOG.fast_food_burgers,
        ];
      } else if (
        restNameLower.includes("santosh dhaba") ||
        restCategoriesLower.includes("pure veg")
      ) {
        candidatePool = [
          ...CATALOG.biryani_mughlai.filter((i) => i.veg),
          ...CATALOG.south_indian.filter((i) => i.veg),
          ...CATALOG.chinese_asian.filter((i) => i.veg),
          ...CATALOG.pizza_italian.filter((i) => i.veg),
        ];
      } else {
        // Multi-cuisine / Biryani / Kebabs / North Indian (Pista House, Bawarchi, Paradise, Mehfil, Shah Ghouse, etc.)
        candidatePool = [
          ...CATALOG.biryani_mughlai,
          ...CATALOG.chinese_asian,
          ...CATALOG.fast_food_burgers,
          ...CATALOG.south_indian,
        ];
      }

      // Filter out products already present in this restaurant
      let availableItems = candidatePool.filter(
        (item) => !existingNames.has(item.name.trim().toLowerCase())
      );

      // If still not enough, grab from all catalog
      if (availableItems.length < needed) {
        const remainingCatalog = ALL_CATALOG_ITEMS.filter(
          (item) => !existingNames.has(item.name.trim().toLowerCase())
        );
        availableItems = [...availableItems, ...remainingCatalog];
      }

      // Pick exact needed items
      const toAdd = availableItems.slice(0, needed);

      for (let i = 0; i < toAdd.length; i++) {
        const proto = toAdd[i];
        const uniqueSuffix = `${rest._id.toString().slice(-4)}-${Date.now().toString().slice(-4)}${i}`;
        const itemSlug = `${slugify(rest.name)}-${slugify(proto.name)}-${uniqueSuffix}`;

        const newProduct = {
          name: proto.name,
          slugUrl: itemSlug,
          description: proto.description,
          restauntId: rest._id,
          restaunt: rest.name,
          category: proto.category,
          categoryUrl: proto.categoryUrl,
          veg: proto.veg,
          Nonveg: proto.Nonveg,
          menu_types: proto.menu_types || ["Main Course"],
          status: true,
          OutOfStack: false,
          thumbnail: proto.thumbnail,
          searchkeywords: `${proto.name} ${proto.category} ${rest.name}`,
          keywords: `${proto.name}, ${proto.category}`,
          rating: proto.rating || 4.7,
          ratingCount: proto.ratingCount || 150,
          trending: Boolean(proto.trending),
          recommendation: Boolean(proto.recommendation),
          packSize: proto.packSize || [{ packSizeName: "Regular", Price: 199, Prime: false }],
        };

        await Product.create(newProduct);
        existingNames.add(proto.name.trim().toLowerCase());
        totalAdded++;
      }

      const finalCount = await Product.countDocuments({ restauntId: rest._id });
      console.log(`  -> Added ${toAdd.length} products. Restaurant now has ${finalCount} products.`);
    }

    console.log(`\n======================================================`);
    console.log(`COMPLETED SEEDING: Added a total of ${totalAdded} new products.`);
    console.log(`Every restaurant now has at least 15 diverse menu items with valid images!`);
    console.log(`======================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error during seeding:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedRestaurantProducts();
