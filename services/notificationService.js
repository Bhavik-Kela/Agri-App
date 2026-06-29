const Notification = require("../models/Notification");

/**
 * createNotification
 * ────────────────────────────────────────────────────────────────────────
 * Single entry point for creating a notification, used by every other
 * controller/handler that needs to notify a user (order accept/reject,
 * new order, new chat message, reviews, etc.) This is the piece that
 * satisfies "avoid duplicate code" / "modular" from the spec — nobody
 * else should call `Notification.create()` directly.
 *
 * Flow, matching the spec's diagram exactly:
 *   1. Save to MongoDB (persists even if recipient is offline)
 *   2. Populate sender (so the emitted payload has name/photo, same as
 *      the chat message flow already does for `sender` in server.js)
 *   3. Emit to the recipient's personal room via Socket.IO, if connected
 *
 * `io` is passed in (not required at the top of this file) because this
 * service has no socket instance of its own — server.js owns `io` and
 * hands it to whichever controller calls this, the same way Express
 * handlers receive `req`/`res` rather than reaching for globals.
 *
 * @param {import("socket.io").Server} io - the Socket.IO server instance from server.js
 * @param {Object} params
 * @param {string} params.recipient - User ID who receives this notification (required)
 * @param {string} [params.sender] - User ID who triggered it (omit for SYSTEM notifications)
 * @param {string} params.type - one of NOTIFICATION_TYPES (see models/Notification.js)
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.order] - Order ID, for deep-linking
 * @param {string} [params.product] - Product ID, for deep-linking
 * @param {string} [params.chatRoom] - chat room key, for deep-linking straight to ChatScreen
 * @returns {Promise<Object>} the created, sender-populated notification document
 */
async function createNotification(io, params) {
  const {
    recipient,
    sender = null,
    type,
    title,
    message,
    order = null,
    product = null,
    chatRoom = null,
  } = params;

  if (!recipient || !type || !title || !message) {
    // Fail loudly in server logs but never throw up into the caller's
    // request/socket flow — a broken notification should never break
    // the order/review/chat action that triggered it.
    console.log("createNotification: missing required field(s)", {
      recipient, type, title, message,
    });
    return null;
  }

  try {
    // ── Collapse repeated chat notifications ────────────────────────────
    // For NEW_MESSAGE specifically: if the recipient already has an
    // UNREAD NEW_MESSAGE notification for this exact order, update that
    // same row instead of creating a new one — bump its count, swap in
    // the latest message text, and refresh createdAt so it re-sorts to
    // the top of the list (same UX as "conversation moved to top").
    // Once the recipient reads it (isRead becomes true), the next new
    // message starts a fresh row — this is intentional: "5 unread"
    // should reset to "1 unread" after they've actually seen the 5.
    if (type === "NEW_MESSAGE" && order) {
      const existing = await Notification.findOne({
        recipient,
        order,
        type: "NEW_MESSAGE",
        isRead: false,
      });

      if (existing) {
        existing.message = message;
        existing.title = title;
        existing.sender = sender;
        existing.count += 1;
        existing.createdAt = new Date(); // bump to top of "newest first" sort
        await existing.save();
        await existing.populate("sender", "name profilePhoto");

        if (io) {
          io.to(`user_${recipient}`).emit("new_notification", existing);
        }

        return existing;
      }
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      order,
      product,
      chatRoom,
    });

    await notification.populate("sender", "name profilePhoto");

    // Every authenticated socket joins `user_<id>` on connection (see the
    // one-line addition to server.js's io.on("connection") block). This
    // is what lets us target "this specific user" regardless of which
    // order-room(s) they're currently in, or whether they're in any
    // room at all yet (e.g. NEW_ORDER fires before a chat room exists).
    if (io) {
      io.to(`user_${recipient}`).emit("new_notification", notification);
    }

    return notification;

  } catch (err) {
    console.log("createNotification error:", err.message);
    return null;
  }
}

module.exports = { createNotification };