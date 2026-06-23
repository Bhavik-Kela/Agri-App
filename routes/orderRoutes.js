const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  createOrder,
  getMyOrders,
  getFarmerOrders,
  updateOrderStatus,
  updateOrder,
  getMessages,
  postMessage,
} = require("../controllers/orderController");

router.post(
  "/",
  authMiddleware,
  createOrder
);

router.get(
  "/my",
  authMiddleware,
  getMyOrders
);

router.get(
  "/farmer",
  authMiddleware,
  getFarmerOrders
);

router.put(
  "/:id/status",
  authMiddleware,
  updateOrderStatus
);

router.put(
  "/:id",
  authMiddleware,
  updateOrder
);

router.get(
  "/:orderId/messages",
  authMiddleware,
  getMessages
);

router.post(
  "/:orderId/messages",
  authMiddleware,
  postMessage
);

module.exports = router;