require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const farmerReviewRoutes = require("./routes/farmerReviewRoutes");

const Message = require("./models/Message");
const { createNotification } = require("./services/notificationService");
const Order = require("./models/order");

const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// ── Create HTTP server and attach Socket.IO ──────────────────────────────
// We wrap Express in a plain Node http.Server so Socket.IO can share the
// same port as the REST API. Nothing else changes for REST — all existing
// routes continue to work exactly as before.
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",          // tighten to your IP in production
    methods: ["GET", "POST"],
  },
});

// ── Uploads dir ──────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ── Express middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// ── REST routes (completely unchanged) ──────────────────────────────────
app.use("/api/auth",           authRoutes);
app.use("/api/products",       productRoutes);
app.use("/api/orders",         orderRoutes);
app.use("/api/reviews",        reviewRoutes);
app.use("/api/farmer-reviews", farmerReviewRoutes);
app.use("/api/notifications",  notificationRoutes);

app.get("/", (_req, res) => res.send("Backend Running"));

// ── Socket.IO JWT auth middleware ────────────────────────────────────────
// Every socket connection must send a valid JWT in the handshake.
// This mirrors your existing authMiddleware so the same token works.
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the decoded user to the socket so every event handler can
    // read socket.user.id / socket.user.role without hitting the DB.
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// ── Socket.IO connection handler ─────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} | user: ${socket.user.id}`);


  socket.join(`user_${socket.user.id}`);

  // ── join_room ────────────────────────────────────────────────────────
  // Client emits this when ChatScreen mounts.
  // We verify the user actually belongs to this order before joining,
  // so random users cannot listen to someone else's chat room.
  socket.on("join_room", async ({ orderId }) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return socket.emit("error", { message: "Order not found" });

    const uid = socket.user.id;
    const isMember =
      order.buyer.toString() === uid ||
      order.farmer.toString() === uid;

    if (!isMember) return socket.emit("error", { message: "Not authorized" });

    const room = `order_${orderId}`;
    socket.join(room);
    console.log(`User ${uid} joined room ${room}`);
  } catch (err) {
    socket.emit("error", { message: err.message });
  }
});
  // ── send_message ─────────────────────────────────────────────────────
  // Client emits this instead of POST /orders/:orderId/messages.
  // We keep the REST POST endpoint alive — it still works for fallback —
  // but the real-time path goes through here.
  socket.on("send_message", async ({ orderId, text }) => {
  try {
    if (!text?.trim()) return;

    const order = await Order.findById(orderId);
    if (!order) return socket.emit("error", { message: "Order not found" });

    const uid = socket.user.id;
    const isMember =
      order.buyer.toString() === uid ||
      order.farmer.toString() === uid;

    if (!isMember) return socket.emit("error", { message: "Not authorized" });

    if (order.status !== "accepted") {
      return socket.emit("error", { message: "Chat only available for accepted orders" });
    }

    const message = await Message.create({
      order: orderId,
      sender: uid,
      text: text.trim(),
    });

    await message.populate("sender", "name email");

    const room = `order_${orderId}`;
    io.to(room).emit("new_message", message);

    const recipientId =
      order.buyer.toString() === uid ? order.farmer.toString() : order.buyer.toString();

    await createNotification(io, {
      recipient: recipientId,
      sender: uid,
      type: "NEW_MESSAGE",
      title: "New message",
      message: text.trim().length > 60 ? `${text.trim().slice(0, 60)}…` : text.trim(),
      order: orderId,
      chatRoom: room,
    });

  } catch (err) {
    socket.emit("error", { message: err.message });
  }
});

  // ── typing ───────────────────────────────────────────────────────────
  // Lightweight — no DB write. Just rebroadcast to the OTHER person in
  // the room. We exclude the sender with `socket.to()` not `io.to()`.
  socket.on("typing", ({ orderId, isTyping }) => {
    const room = `order_${orderId}`;
    socket.to(room).emit("user_typing", {
      userId: socket.user.id,
      isTyping,
    });
  });

  // ── mark_read ────────────────────────────────────────────────────────
  // Client emits this when they open/view the chat.
  // We update all messages in this order that were NOT sent by this user
  // and are still unread. Then we tell the other person their messages
  // were read so they can show ✓✓ read receipts.
 socket.on("mark_read", async ({ orderId }) => {
  try {
    const uid = socket.user.id;

    // Only stamp readAt on messages sent by the OTHER person
    // (not my own messages — that would make me think they were read)
    await Message.updateMany(
      {
        order: orderId,
        sender: { $ne: uid },  // messages NOT sent by me
        readAt: null,
      },
      { $set: { readAt: new Date() } }
    );

    const room = `order_${orderId}`;
    socket.to(room).emit("messages_read", { readBy: uid, orderId });
  } catch (err) {
    console.log("mark_read error:", err.message);
  }
});

  // ── disconnect ───────────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} | reason: ${reason}`);
    // Socket.IO automatically removes the socket from all rooms on
    // disconnect — no manual cleanup needed.
  });
});

// ── MongoDB + server start ───────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    try {
      const FarmerReview = require("./models/FarmerReview");
      const { rebuildFarmerRatings } = require("./controllers/farmerReviewController");
      const farmerIds = await FarmerReview.distinct("farmer");
      for (const farmerId of farmerIds) await rebuildFarmerRatings(farmerId);
      if (farmerIds.length)
        console.log(`Synced category ratings for ${farmerIds.length} farmer(s)`);
    } catch (err) {
      console.log("Farmer rating backfill skipped:", err.message);
    }
  })
  .catch((err) => console.log(err));

// Use httpServer.listen — NOT app.listen — so Socket.IO shares the port.
httpServer.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});