import mongoose from "mongoose";
import { InvalidateCacheProps, OderItem } from "../types/types.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { Order } from "../models/order.js";

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecommerce",
    })
    .then((c) => console.log("Database Connected"))
    .catch((e) => console.log(e));
};

export const invalidateCache = ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      `categories`,
      `latest-products`,
      `all-products`,
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);
    else if (typeof productId === "object") {
      productId.forEach((i) => productKeys.push(`product-${i}`));
    }

    myCache.del(productKeys);
  }
  if (order) {
    const ordersKeys: string[] = [
      `all-orders`,
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    myCache.del(ordersKeys);
  }
  if (admin) {
    myCache.del(["admin-stats", "pie-charts", "bar-charts", "line-charts"]);
  }
};

export const reduceStack = async (orderItems: OderItem[]) => {
  let stock = 0;
  orderItems.forEach(async (item) => {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error("Product not found");
    product.stock -= item.quantity;
    await product.save();
  });
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = ((thisMonth - lastMonth) / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};
