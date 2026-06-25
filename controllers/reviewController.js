const Review = require("../models/Review");
const Order = require("../models/order");
const Product = require("../models/Product");

const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });

  const reviewCount = reviews.length;

  let averageRating = 0;

  if (reviewCount > 0) {
    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    averageRating = totalRating / reviewCount;
  }

  await Product.findByIdAndUpdate(productId, {
    averageRating: Number(averageRating.toFixed(1)),
    reviewCount,
  });
};

// Create Product Review
exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    // Validate required fields
    if (!orderId || !rating || !comment) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    // Rating validation
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5."
      });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    // Check if logged-in user is the buyer
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only review your own orders."
      });
    }

    // Check if order is completed
    if (order.status !== "completed") {
      return res.status(400).json({
        message: "You can review only completed orders."
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      order: orderId
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this order."
      });
    }

    // Create review
    const review = await Review.create({
      order: order._id,
      buyer: order.buyer,
      farmer: order.farmer,
      product: order.product,
      rating,
      comment
    });
    await updateProductRating(order.product);

    res.status(201).json({
      message: "Review added successfully.",
      review
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
};

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    const reviews = await Review.find({
      product: productId
    })
      .populate("buyer", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      reviews
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
};