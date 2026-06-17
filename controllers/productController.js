const Product = require("../models/Product");

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      name: req.body.name,
      price: req.body.price,
      quantity: req.body.quantity,
      category: req.body.category,
      farmer: req.user.id
    });

    res.status(201).json(product);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

// Get All Products
exports.getProducts = async (req, res) => {

  try {

    const products = await Product.find()
      .populate("farmer", "name email");

    res.json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

exports.getProductById = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id)
      .populate("farmer", "name email");

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

exports.updateProduct = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    const updatedProduct =
      await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json(updatedProduct);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

exports.deleteProduct = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "Product deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

exports.getMyProducts = async (req, res) => {
  try {

    const products = await Product.find({
      farmer: req.user.id
    });

    res.json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};