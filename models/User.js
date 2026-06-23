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
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);