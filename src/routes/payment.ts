import express from "express";
import {
  applyCoupon,
  createPaymentIntent,
  deleteCoupon,
  getAllCoupons,
  newCoupon,
} from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

app.post("/create",createPaymentIntent);
app.post("/coupon/new",adminOnly, newCoupon);
app.get("/coupon/all", adminOnly, getAllCoupons);
app.get("/discount",  applyCoupon);
app.delete("/coupon/:id", adminOnly, deleteCoupon);

export default app;
