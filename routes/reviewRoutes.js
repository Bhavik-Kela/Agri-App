const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");
const reviewController = require("../controllers/reviewController");

// Create Product Review
router.post("/", auth, reviewController.createReview);

// Get all reviews for a product
router.get(
  "/product/:productId",
  reviewController.getProductReviews
);

module.exports = router;