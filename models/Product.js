const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    pricePerUnit: {
      type: Number,
      default: 0,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      enum: ["kg", "g", "liter", "ml", "piece", "dozen"],
      default: "kg",
    },

    category: {
      type: String,
      required: true,
    },

    photo: {
      type: String,
      default: "",
    },

    otherProductName: {
      type: String,
      default: "",
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    averageRating: {
  type: Number,
  default: 0,
},

reviewCount: {
  type: Number,
  default: 0,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);