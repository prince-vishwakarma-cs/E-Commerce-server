import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderBody } from "../types/types.js";
import { Order } from "../models/order.js";
import { invalidateCache, reduceStack } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderBody>, res, next) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subTotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;

    if (
      !shippingInfo ||
      !orderItems ||
      !user ||
      !subTotal ||
      !tax ||
      !shippingCharges ||
      !discount ||
      !total
    )
      return next(new ErrorHandler("Please enter all fields", 400));
    await reduceStack(orderItems);

    await Order.create({
      shippingInfo,
      orderItems,
      user,
      subTotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: orderItems.map((item) => item.productId.toString()),
    });

    return res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
    });
  }
);
export const myOrders = TryCatch(async (req, res, next) => {
  const { id: user } = req.query;
  let orders = [];

  if (myCache.has(`my-orders-${user}`))
    orders = JSON.parse(myCache.get(`my-orders-${user}`) as string);
  else {
    orders = await Order.find({ user });
    myCache.set(`my-orders-${user}`, JSON.stringify(orders));
  }

  return res.status(201).json({
    success: true,
    orders,
  });
});

export const allOrders = TryCatch(async (req, res, next) => {
  let orders = [];

  if (myCache.has(`all-orders`))
    orders = JSON.parse(myCache.get(`all-orders`) as string);
  else {
    orders = await Order.find({}).populate("user", "name");
    myCache.set(`all-orders`, JSON.stringify(orders));
  }

  return res.status(201).json({
    success: true,
    orders,
  });
});

export const orderDetails = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  let order;
  const key = `order-${id}`;
  if (myCache.has(key)) order = JSON.parse(myCache.get(key) as string);
  else {
    order = await Order.findById(id).populate("user", "name");
    if (!order) return next(new ErrorHandler("Order Not Found", 404));
    myCache.set(key, JSON.stringify(order));
  }

  return res.status(201).json({
    success: true,
    order,
  });
});

export const processOrder = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not Found", 404));
  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }
  await order.save();
  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });
  return res.status(201).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not Found", 404));
  await order.deleteOne();
  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });
  return res.status(201).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
