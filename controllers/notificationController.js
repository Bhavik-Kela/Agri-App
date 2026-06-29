const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// Get Notifications (paginated, newest first)
// GET /api/notifications?page=1&limit=20
exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipient: req.user.id })
        .populate("sender", "name profilePhoto")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user.id }),
    ]);

    res.json({
      notifications,
      page,
      hasMore: skip + notifications.length < total,
      total,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Get Unread Count
// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    // Sum `count`, not row count — a single collapsed NEW_MESSAGE row
    // with count: 5 should contribute 5 to the badge, not 1.
    const result = await Notification.aggregate([
      { $match: { recipient: new mongoose.Types.ObjectId(req.user.id), isRead: false } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    const count = result[0]?.total || 0;

    res.json({ count });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Mark One Notification as Read
// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id, // ownership check — can't mark someone else's notification read
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Mark All Notifications as Read
// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      message: "All notifications marked as read"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Delete Multiple Notifications
// DELETE /api/notifications/delete-bulk
exports.deleteNotifications = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
      return res.status(400).json({
        message: "At least one valid notification id is required",
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: validIds },
      recipient: req.user.id, // ownership check
    });

    res.json({
      message: "Notifications deleted successfully",
      deletedCount: result.deletedCount || 0,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Delete Notification
// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id, // ownership check
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      message: "Notification deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
