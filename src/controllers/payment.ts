import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";


export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) return next(new ErrorHandler("Please enter amount", 400));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "inr",
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const { code, amount } = req.body;

  if (!code || !amount)
    return next(new ErrorHandler("Please enter all fields", 400));
  await Coupon.create({ code, amount });

  return res.status(201).json({
    success: true,
    message: "Coupon Created Successfully",
  });
});

export const getAllCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});

  return res.status(201).json({
    success: true,
    coupons,
  });
});

export const applyCoupon = TryCatch(async (req, res, next) => {
  const { code } = req.query;

  const validCoupon = await Coupon.findOne({ code });

  if (!validCoupon) return next(new ErrorHandler("Invalid Coupon Code", 400));

  return res.status(200).json({
    success: true,
    message: "Coupon Applied Successfully",
    discount: validCoupon.amount,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("Invalid Coupon Id", 400));

  return res.status(200).json({
    success: true,
    message: "Coupon Deleted Successfully",
  });
});
