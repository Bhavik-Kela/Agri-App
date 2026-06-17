const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require("../controllers/productController");

const authMiddleware =
  require("../middleware/authMiddleware");

router.post(
  "/",
  authMiddleware,
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
  updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  deleteProduct
);

module.exports = router;