const mongoose = require("mongoose");

// ── Notification types ───────────────────────────────────────────────────
// Centralized here so controllers/services import ONE source of truth
// instead of typing raw strings. Adding a new notification type later
// means adding one line here + one line wherever you create it — nothing
// else in the schema needs to change.
const NOTIFICATION_TYPES = [
  "NEW_ORDER",        // farmer <- buyer places an order
  "ORDER_ACCEPTED",   // buyer  <- farmer accepts
  "ORDER_REJECTED",   // buyer  <- farmer rejects
  "ORDER_STATUS",     // buyer  <- generic status change (shipped/completed/etc)
  "NEW_MESSAGE",       // either <- chat message
  "PRODUCT_REVIEW",   // farmer <- buyer reviews a product
  "FARMER_REVIEW",    // farmer <- buyer reviews the farmer
  "SYSTEM",           // either <- generic/admin notice
];

const notificationSchema = new mongoose.Schema(
  {
    // Who sees this notification. Always required — every notification
    // belongs to exactly one inbox.
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // every list/unread-count query filters by recipient
    },

    // Who triggered it. Optional because SYSTEM notifications have no
    // human sender.
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // ── Deep-link payload ──────────────────────────────────────────────
    // These three are all optional and independent — a NEW_MESSAGE
    // notification only needs `order`, a PRODUCT_REVIEW only needs
    // `product`, etc. Keeping them as separate optional refs (instead of
    // one polymorphic field) keeps queries and population simple and
    // lets one notification reference more than one entity if a future
    // type needs it (e.g. a review notification could carry both
    // `product` and `order`).
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    // Redundant with `order` for chat cases (chat rooms are keyed by
    // orderId in this app per ChatScreen/server.js), but kept as an
    // explicit named field so the frontend navigation logic can read
    // `notification.chatRoom` without having to know that chat happens
    // to be modeled on top of orders. If chat is ever decoupled from
    // orders later, only this field's population logic changes.
    chatRoom: {
      type: String,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true, // unread-count queries filter on this
    },

    // How many times this notification has effectively "happened" since
    // it was last read. Used to collapse repeated events (currently just
    // NEW_MESSAGE) into a single row instead of one row per message —
    // e.g. "5 new messages" instead of 5 separate notification cards.
    // Every other type stays at 1 since they're inherently one-shot
    // events (an order doesn't get accepted twice).
    count: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true, // gives us createdAt for "2 min ago" / sort-newest-first
  }
);

// Compound index: every list/unread-count query is "this recipient,
// newest first, optionally filtered by isRead" — this index serves both
// the inbox list query and the unread-count query without a second index.
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;