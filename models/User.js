const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: [
          "farmer",
          "buyer",
          "shop",
          "company",
          "admin"
        ],
        default: "farmer"
    },

    phone: {
        type: String,
        default: ""
    },

    addresses: [{
        _id: mongoose.Schema.Types.ObjectId,
        label: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        isDefault: Boolean
    }],

    profilePhoto: {
        type: String,
        default: ""
    },
    averageFarmerRating: {
        type: Number,
        default: 0
    },

    averageQualityRating: {
        type: Number,
        default: 0
    },

    averageFreshnessRating: {
        type: Number,
        default: 0
    },

    averageCommunicationRating: {
        type: Number,
        default: 0
    },

    averageDeliveryRating: {
        type: Number,
        default: 0
    },

    farmerReviewCount: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);