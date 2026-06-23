const express = require("express");
const router = express.Router();

const {
  register,
  login,
  profile,
  updateProfile,
  addAddress,
  setDefaultAddress,
  deleteAddress,
  resetPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);

router.get("/profile", authMiddleware, profile);

router.put("/profile", authMiddleware, updateProfile);

router.post("/address", authMiddleware, addAddress);
router.put("/address/:addressId/default", authMiddleware, setDefaultAddress);
router.delete("/address/:addressId", authMiddleware, deleteAddress);

module.exports = router;