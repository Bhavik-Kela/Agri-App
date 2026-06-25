const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");
const farmerReviewController = require("../controllers/farmerReviewController");

// Create Farmer Review
router.post(
  "/",
  auth,
  farmerReviewController.createFarmerReview
);

// Get all reviews for a farmer
router.get(
  "/:farmerId",
  farmerReviewController.getFarmerReviews
);

module.exports = router;