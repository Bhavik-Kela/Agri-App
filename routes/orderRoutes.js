const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  createOrder,
  getMyOrders,
  getFarmerOrders,
  updateOrderStatus
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

module.exports = router;