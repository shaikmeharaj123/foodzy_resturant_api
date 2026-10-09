const http = require("http");
const { Server } = require("socket.io");
const app = require("./App");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary");
const connectDatabase = require("./config/database");

// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Uncaught Exception`);
  process.exit(1);
});

//config
dotenv.config({ path: "config/config.env" });

//connecting to database
connectDatabase();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const server = http.createServer(app);

// Initialize Socket.io with permissive CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // 1. Join Order Room for Live Tracking
  socket.on("join_order_room", (orderId) => {
    if (orderId) {
      const room = `order_${orderId}`;
      socket.join(room);
      console.log(`[Socket] Socket ${socket.id} joined room: ${room}`);
      socket.emit("joined_room", { room, success: true });
    }
  });

  // 2. Rider Accepts Order
  socket.on("rider_accept_order", (data) => {
    // data: { orderId, riderId, riderName, riderPhone, riderLatitude, riderLongitude }
    if (data?.orderId) {
      const room = `order_${data.orderId}`;
      console.log(`[Socket] Rider accepted order: ${data.orderId}`, data);
      const payload = {
        orderId: data.orderId,
        order_status: 3, // On the way / Assigned
        status: "Rider Assigned & Heading to Restaurant",
        rider: {
          id: data.riderId,
          name: data.riderName || "Ramesh Kumar",
          phone: data.riderPhone || "+91 9908018296",
          latitude: data.riderLatitude,
          longitude: data.riderLongitude,
        },
      };
      io.to(room).emit("order_status_update", payload);
      io.to("admin_room").emit("admin:order_updated", payload);
    }
  });

  // 3. Live Rider Location Tracking Stream
  socket.on("rider_location_update", (data) => {
    // data: { orderId, latitude, longitude, heading, speed }
    if (data?.orderId) {
      const room = `order_${data.orderId}`;
      const payload = {
        orderId: data.orderId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading || 0,
        updatedAt: new Date().toISOString(),
      };
      io.to(room).emit("rider_location_changed", payload);
      io.emit("rider_location_changed", payload);
    }
  });

  // 4. General Order Status Change (1: Placed, 2: Preparing, 3: On the way, 4: Delivered, 5: Cancelled)
  socket.on("update_order_status", (data) => {
    if (data?.orderId) {
      const room = `order_${data.orderId}`;
      io.to(room).emit("order_status_update", data);
      io.to("admin_room").emit("admin:order_updated", data);
    }
  });

  // 5. Rider Room Management for Targeted Notifications & Broadcasts
  socket.on("rider:join", ({ riderId }) => {
    if (riderId) {
      const riderRoom = `rider_${riderId}`;
      socket.join(riderRoom);
      socket.join("all_riders");
      console.log(`[Socket] Rider ${riderId} joined ${riderRoom} and all_riders`);
      socket.emit("rider_joined", { riderId, room: riderRoom, success: true });
    }
  });

  socket.on("rider:leave", ({ riderId }) => {
    if (riderId) {
      socket.leave(`rider_${riderId}`);
      socket.leave("all_riders");
      console.log(`[Socket] Rider ${riderId} left rooms`);
    }
  });

  // 6. Customer Room Management for Targeted Notifications & Broadcasts
  socket.on("customer:join", (data = {}) => {
    const userId = data?.userId;
    socket.join("all_customers");
    if (userId) {
      const userRoom = `user_${userId}`;
      socket.join(userRoom);
      console.log(`[Socket] Customer ${userId} joined ${userRoom} and all_customers`);
      socket.emit("customer_joined", { userId, room: userRoom, success: true });
    } else {
      console.log(`[Socket] Anonymous Customer joined all_customers`);
      socket.emit("customer_joined", { room: "all_customers", success: true });
    }
  });

  socket.on("customer:leave", (data = {}) => {
    const userId = data?.userId;
    if (userId) {
      socket.leave(`user_${userId}`);
    }
    socket.leave("all_customers");
    console.log(`[Socket] Customer left rooms`);
  });

  // 7. Admin Room Management for Live Order Notifications
  socket.on("admin:join", () => {
    socket.join("admin_room");
    console.log(`[Socket] Admin joined admin_room: ${socket.id}`);
    socket.emit("admin:joined", { success: true });
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4999;
server.listen(PORT, () => {
  console.log(`Server & Socket.io is working on http://localhost:${PORT}`);
});

//Unhandle Promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);
  server.close(() => {
    process.exit(1);
  });
});
