const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },

    totalPrice: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "completed"
      ],
      default: "pending"
    },

    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },

    chatActive: {
      type: Boolean,
      default: false
    },

    rejectionReason: String
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model("Order", orderSchema);