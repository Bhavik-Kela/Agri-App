const Order = require("../models/Order");
const Product = require("../models/Product");
const Message = require("../models/Message");
const User = require("../models/User");

exports.createOrder = async (req, res) => {
  try {

    const { productId, quantity } = req.body;

    const product =
      await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const totalPrice =
      product.price * quantity;

    const order =
      await Order.create({

        buyer: req.user.id,

        farmer: product.farmer,

        product: product._id,

        quantity,

        totalPrice

      });

    res.status(201).json(order);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

exports.getMyOrders = async (req, res) => {
  try {

    const orders = await Order.find({
      buyer: req.user.id
    })
    .populate("product", "name price pricePerUnit unit category")
    .populate("farmer", "name email phone addresses");

    res.json(orders);

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

    const order = await Order.findById(
      req.params.id
    );

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

    order.status = status;

    await order.save();

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