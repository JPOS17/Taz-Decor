import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { categoriesRouter } from "./routes/categories";
import { listingsRouter } from "./routes/listings";
import { authRouter } from "./routes/auth";
import { inventoryRouter } from "./routes/inventory";
import { adminRouter } from "./routes/admin";
import { reviewsRouter } from "./routes/reviews";
import { cartRouter } from "./routes/cart";
import { wishlistRouter } from "./routes/wishlist";
import { sellerLocationRouter } from "./routes/sellerLocation";
import { productTypesRouter } from "./routes/productTypes";
import { couponManagementRouter } from "./routes/couponManagement";
import { checkoutRouter } from "./routes/checkout";
import { settingsRouter } from './routes/settings';
import { userRouter } from './routes/user';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://taz-decor-catholic-company.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ 
    message: "Family Store API Server", 
    status: "running",
    endpoints: {
      categories: "/api/categories",
      products: "/api/products",
      auth: "/api/auth",
      management: "/api/management/products",
      admin: "/api/admin",
      reviews: "/api/reviews",
      cart: "/api/cart",
      wishlist: "/api/wishlist",
      seller_location: "/api/sellerLocation",
      product_types: "/api/product-types",
      coupons: "/api/coupons",
      checkout: "/api/checkout",
      settings: "/api/settings",
      user: "/api/user"
    }
  });
});

// Routes
app.use("/api/categories", categoriesRouter);
app.use("/api/products", listingsRouter);
app.use("/api/auth", authRouter);
app.use("/api/management/products", inventoryRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/sellerlocation", sellerLocationRouter);
app.use('/api/product-types', productTypesRouter);
app.use('/api/coupons', couponManagementRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/user', userRouter);

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});