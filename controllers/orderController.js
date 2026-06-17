const Order = require("../models/Order");
const Product = require("../models/Product");

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
    .populate("product", "name price category")
    .populate("farmer", "name email");

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
    .populate("product", "name price category");

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