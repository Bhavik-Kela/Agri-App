const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/",
  authMiddleware,
  upload.single("photo"),
  createProduct
);

router.get(
  "/",
  getProducts
);

router.get(
  "/my",
  authMiddleware,
  getMyProducts
);

router.get("/:id", getProductById);

router.put(
  "/:id",
  authMiddleware,
  upload.single("photo"),
  updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  deleteProduct
);

module.exports = router;