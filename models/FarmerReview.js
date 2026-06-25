const mongoose = require("mongoose");

const farmerReviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    qualityRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    freshnessRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    communicationRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    deliveryRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    overallRating: {
      type: Number,
      required: true,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FarmerReview", farmerReviewSchema);