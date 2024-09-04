import express from "express";
import userRoute from "./routes/user.js";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import productRoute from "./routes/product.js";
import NodeCache from "node-cache";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
import { config } from "dotenv";
import morgan from "morgan";
import dashboardRoute from "./routes/stats.js";
import Stripe from "stripe";
import cors from "cors";
config({
  path: "./.env",
});

const port = process.env.PORT;
const mongourl = process.env.MONGO_URL || "";
const stripekey = process.env.STRIPE_KEY || "";
const app = express();
connectDB(mongourl);

export const stripe = new Stripe(stripekey);
export const myCache = new NodeCache();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/", (req, res) => {
  res.send("it is working");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.use("/uploads", express.static("uploads"));

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`server is running on localhost ${port}`);
});
