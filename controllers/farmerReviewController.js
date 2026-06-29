const FarmerReview = require("../models/FarmerReview");
const Order = require("../models/order");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");

// Recompute and persist all farmer rating aggregates (called on review create)
const updateFarmerRating = async (farmerId) => {
  const reviews = await FarmerReview.find({ farmer: farmerId });

  const farmerReviewCount = reviews.length;

  let averageFarmerRating = 0;
  let averageQualityRating = 0;
  let averageFreshnessRating = 0;
  let averageCommunicationRating = 0;
  let averageDeliveryRating = 0;

  if (farmerReviewCount > 0) {
    let totalOverall = 0;
    let totalQuality = 0;
    let totalFreshness = 0;
    let totalCommunication = 0;
    let totalDelivery = 0;

    for (const review of reviews) {
      totalOverall += review.overallRating;
      totalQuality += review.qualityRating;
      totalFreshness += review.freshnessRating;
      totalCommunication += review.communicationRating;
      totalDelivery += review.deliveryRating;
    }

    averageFarmerRating = totalOverall / farmerReviewCount;
    averageQualityRating = totalQuality / farmerReviewCount;
    averageFreshnessRating = totalFreshness / farmerReviewCount;
    averageCommunicationRating = totalCommunication / farmerReviewCount;
    averageDeliveryRating = totalDelivery / farmerReviewCount;
  }

  await User.findByIdAndUpdate(farmerId, {
    averageFarmerRating: Number(averageFarmerRating.toFixed(1)),
    averageQualityRating: Number(averageQualityRating.toFixed(1)),
    averageFreshnessRating: Number(averageFreshnessRating.toFixed(1)),
    averageCommunicationRating: Number(averageCommunicationRating.toFixed(1)),
    averageDeliveryRating: Number(averageDeliveryRating.toFixed(1)),
    farmerReviewCount,
  });
};

exports.rebuildFarmerRatings = updateFarmerRating;

// Create Farmer Review
exports.createFarmerReview = async (req, res) => {
  try {
    const {
      orderId,
      qualityRating,
      freshnessRating,
      communicationRating,
      deliveryRating,
      comment,
    } = req.body;

    if (
      !orderId ||
      !qualityRating ||
      !freshnessRating ||
      !communicationRating ||
      !deliveryRating
    ) {
      return res.status(400).json({
        message: "All ratings are required.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can review only your own orders.",
      });
    }

    if (order.status !== "completed") {
      return res.status(400).json({
        message: "Order is not completed.",
      });
    }

    const existingReview = await FarmerReview.findOne({
      order: orderId,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "Farmer already reviewed for this order.",
      });
    }

    const overallRating = Number(
      (
        (
          qualityRating +
          freshnessRating +
          communicationRating +
          deliveryRating
        ) / 4
      ).toFixed(1)
    );

    const review = await FarmerReview.create({
      order: order._id,
      buyer: order.buyer,
      farmer: order.farmer,
      qualityRating,
      freshnessRating,
      communicationRating,
      deliveryRating,
      overallRating,
      comment,
    });

   await updateFarmerRating(order.farmer);

    await createNotification(req.app.get("io"), {
      recipient: order.farmer,
      sender: req.user.id,
      type: "FARMER_REVIEW",
      title: "New farmer review",
      message: `A buyer left a ${overallRating}-star review on your farmer profile.`,
      order: order._id,
    });

    res.status(201).json({
      message: "Farmer review added successfully.",
      review,
    });


  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get Farmer Reviews
exports.getFarmerReviews = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const farmer = await User.findById(farmerId);

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found."
      });
    }

    const reviews = await FarmerReview.find({
      farmer: farmerId
    })
      .populate("buyer", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      averageFarmerRating: farmer.averageFarmerRating,
      averageQualityRating: farmer.averageQualityRating,
      averageFreshnessRating: farmer.averageFreshnessRating,
      averageCommunicationRating: farmer.averageCommunicationRating,
      averageDeliveryRating: farmer.averageDeliveryRating,
      farmerReviewCount: farmer.farmerReviewCount,
      reviews
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
};