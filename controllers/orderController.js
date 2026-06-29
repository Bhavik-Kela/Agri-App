const Order = require("../models/order");
const Product = require("../models/Product");
const Message = require("../models/Message");
const User = require("../models/User");
const Review = require("../models/Review");
const FarmerReview = require("../models/FarmerReview");
const { createNotification } = require("../services/notificationService");

exports.createOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Look for an existing PENDING order from this same buyer on this product
    const existingPending = await Order.findOne({
      buyer: req.user.id,
      product: product._id,
      status: "pending",
    });

    const alreadyReserved = existingPending ? existingPending.quantity : 0;
    const newTotalQty = alreadyReserved + qty;

    if (newTotalQty > product.quantity) {
      const remaining = Math.max(product.quantity - alreadyReserved, 0);
      return res.status(400).json({
        message: `You can only reserve ${remaining} more unit(s) of this product.`,
      });
    }

    if (existingPending) {
      // Merge: bump quantity and recompute total price on the SAME order
      existingPending.quantity = newTotalQty;
      existingPending.totalPrice = product.price * newTotalQty;
      await existingPending.save();
      return res.status(200).json(existingPending);
    }

    const totalPrice = product.price * qty;

      const order = await Order.create({
      buyer: req.user.id,
      farmer: product.farmer,
      product: product._id,
      quantity: qty,
      totalPrice,
    });

    await createNotification(req.app.get("io"), {
      recipient: product.farmer,
      sender: req.user.id,
      type: "NEW_ORDER",
      title: "New order received",
      message: `You have a new order for ${product.name}.`,
      order: order._id,
      product: product._id,
    });

    res.status(201).json(order);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getMyOrders = async (req, res) => {
  try {

    const orders = await Order.find({
      buyer: req.user.id
    })
    .sort({ createdAt: -1 })
    .populate("product", "name price pricePerUnit unit category")
    .populate("farmer", "name email phone addresses averageFarmerRating farmerReviewCount");

    const orderIds = orders.map((order) => order._id);

    const [productReviews, farmerReviews] = await Promise.all([
      Review.find({ order: { $in: orderIds } }).select("order"),
      FarmerReview.find({ order: { $in: orderIds } }).select("order"),
    ]);

    const productReviewOrderIds = new Set(
      productReviews.map((review) => review.order.toString())
    );
    const farmerReviewOrderIds = new Set(
      farmerReviews.map((review) => review.order.toString())
    );

    const ordersWithReviewFlags = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.hasProductReview = productReviewOrderIds.has(order._id.toString());
      orderObj.hasFarmerReview = farmerReviewOrderIds.has(order._id.toString());
      return orderObj;
    });

    res.json(ordersWithReviewFlags);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

exports.getFarmerOrders = async (req, res) => {
  try {

    const orders = await Order.find({
      farmer: req.user.id
    })
    .sort({ createdAt: -1 })
    .populate("buyer", "name email")
    .populate("product", "name price pricePerUnit unit category");

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

exports.updateOrderStatus = async (req, res) => {
  try {

    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (
      order.farmer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    if (order.status === "accepted" && status === "rejected") {
      return res.status(400).json({
        message: "This order has already been accepted. It cannot be rejected."
      });
    }

    if (order.status === "rejected" || order.status === "completed") {
      return res.status(400).json({
        message: "This order cannot be modified."
      });
    }

    // Accepting an order locks in stock: decrement product quantity,
    // then trim or remove any other pending orders that no longer fit.
    if (status === "accepted" && order.status !== "accepted") {
      const product = await Product.findById(order.product);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (order.quantity > product.quantity) {
        return res.status(400).json({
          message: "Not enough stock remaining to accept this order."
        });
      }

      product.quantity -= order.quantity;
      await product.save();

      const otherPending = await Order.find({
        product: product._id,
        status: "pending",
        _id: { $ne: order._id },
      });

      for (const other of otherPending) {
        if (product.quantity <= 0) {
          await Order.deleteOne({ _id: other._id });
        } else if (other.quantity > product.quantity) {
          other.quantity = product.quantity;
          other.totalPrice = product.price * product.quantity;
          await other.save();
        }
      }
    }

    order.status = status;

    await order.save();

    if (status === "accepted" || status === "rejected") {
      await createNotification(req.app.get("io"), {
        recipient: order.buyer,
        sender: req.user.id,
        type: status === "accepted" ? "ORDER_ACCEPTED" : "ORDER_REJECTED",
        title: status === "accepted" ? "Order accepted" : "Order rejected",
        message:
          status === "accepted"
            ? "Your order has been accepted by the farmer."
            : "Your order was rejected by the farmer.",
        order: order._id,
        product: order.product,
      });
    }

    res.json(order);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// Update Order with chat status
exports.updateOrder = async (req, res) => {
  try {
    const { chatActive } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // Check if user is buyer or farmer of this order
    if (
      order.buyer.toString() !== req.user.id &&
      order.farmer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    if (chatActive !== undefined) {
      order.chatActive = chatActive;
    }

    await order.save();

    res.json(order);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Get Messages for an Order
exports.getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("buyer", "name email")
      .populate("farmer", "name email");

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // Check if user is part of this order
    if (
      order.buyer._id.toString() !== req.user.id &&
      order.farmer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    const messages = await Message.find({ order: orderId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.json({
      messages,
      buyer: order.buyer,
      seller: order.farmer,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Post Message to an Order
exports.postMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        message: "Message text is required"
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // Check if user is part of this order
    if (
      order.buyer.toString() !== req.user.id &&
      order.farmer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    // Check if order is accepted (chat only available for accepted orders)
    if (order.status !== "accepted") {
      return res.status(400).json({
        message: "Chat is only available for accepted orders"
      });
    }

    const message = await Message.create({
      order: orderId,
      sender: req.user.id,
      text: text.trim(),
    });

    await message.populate("sender", "name email");

    res.status(201).json(message);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
