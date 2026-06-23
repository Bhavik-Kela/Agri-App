const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//Register

exports.register = async (req, res) => {
  try {

    const { name, email, password, role } = req.body;

    const userExists =
      await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
      await User.create({
        name,
        email,
        password: hashedPassword,
        role
      });

    res.status(201).json({
      message: "Registered Successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


//Login

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user =
      await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Profile

exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Profile

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Add Address

exports.addAddress = async (req, res) => {
  try {
    const { label, street, city, state, zipCode } = req.body;

    if (!label || !street || !city) {
      return res.status(400).json({
        message: "Please provide all required address fields"
      });
    }

    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      label,
      street,
      city,
      state,
      zipCode,
      isDefault: false
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { addresses: newAddress } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Set Default Address

exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    // First, set all addresses to non-default
    await User.updateOne(
      { _id: req.user.id },
      { $set: { "addresses[].isDefault": false } }
    );

    // Then set the selected address as default
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { "addresses.$[elem].isDefault": true } },
      { 
        arrayFilters: [{ "elem._id": addressId }],
        new: true 
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Address

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Reset Password

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message: "Email and new password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.json({
      message: "Password reset successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};