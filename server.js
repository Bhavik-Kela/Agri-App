require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const farmerReviewRoutes = require("./routes/farmerReviewRoutes");

const app = express();

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    // Backfill stored category averages for farmers with existing reviews
    try {
      const FarmerReview = require("./models/FarmerReview");
      const { rebuildFarmerRatings } = require("./controllers/farmerReviewController");
      const farmerIds = await FarmerReview.distinct("farmer");
      for (const farmerId of farmerIds) {
        await rebuildFarmerRatings(farmerId);
      }
      if (farmerIds.length) {
        console.log(`Synced category ratings for ${farmerIds.length} farmer(s)`);
      }
    } catch (err) {
      console.log("Farmer rating backfill skipped:", err.message);
    }
  })
  .catch(err => console.log(err));

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/reviews",
  reviewRoutes
);

app.use(
  "/api/farmer-reviews",
  farmerReviewRoutes
);


app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
});