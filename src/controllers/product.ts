import { faker } from "@faker-js/faker";
import { Request } from "express";
import { rm } from "fs";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { BaseQuery, NewProductBody, SeachRequestQuery } from "../types/types.js";
import { invalidateCache } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductBody>, res, next) => {
    const { name, price, stock, category } = req.body;

    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please upload a photo", 400));

    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {
        console.log("Deleted");
      });
      return next(new ErrorHandler("Please enter all fields", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo.path,
    });

    invalidateCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);

export const latestProduct = TryCatch(async (req, res, next) => {
  let products = [];

  if (myCache.has(`latest-products`)) {
    products = JSON.parse(myCache.get(`latest-products`) as string);
  } else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    myCache.set(`latest-products`, JSON.stringify(products));
  }

  return res.status(201).json({
    success: true,
    products,
  });
});

export const updateProduct = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const { name, price, stock, category } = req.body;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product not found", 400));

  const photo = req.file;

  if (photo) {
    rm(product.photo, () => {
      console.log("old photo deleted");
    });
    product.photo = photo.path;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;
  await product.save();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(201).json({
    success: true,
    message: "Product updates successfully",
  });
});

export const productInfo = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;
  if (myCache.has(`product-${id}`))
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  else {
    product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product not found", 400));
    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(201).json({
    success: true,
    product,
  });
});

export const allCategories = TryCatch(async (req, res, next) => {
  let categories;
  if (myCache.has(`categories`))
    categories = JSON.parse(myCache.get(`categories`) as string);
  else {
    categories = await Product.distinct("category");
    myCache.set(`categories`, JSON.stringify(categories));
  }
  return res.status(201).json({
    success: true,
    categories,
  });
});

export const allProducts = TryCatch(async (req, res, next) => {
  let products;
  if (myCache.has(`all-products`))
    products = JSON.parse(myCache.get(`all-products`) as string);
  else {
    products = await Product.find({});
    myCache.set(`all-products`, JSON.stringify(products));
  }
  return res.status(201).json({
    success: true,
    products,
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  console.log("hi");
  if (!product) return next(new ErrorHandler("Product not found", 400));

  rm(product.photo, () => {
    console.log("Product photo deleted");
  });

  await product.deleteOne();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });
  return res.status(201).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const searchProducts = TryCatch(
  async (req: Request<{}, {}, SeachRequestQuery>, res, next) => {
    console.log("gfgd");
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search) baseQuery.name = { $regex: String(search), $options: "i" };
    if (price) baseQuery.price = { $lte: Number(price) };
    if (category) baseQuery.category = String(category);

    const [products, filterdOnlyProducts] = await Promise.all([
      Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      Product.find(baseQuery),
    ]);

    const totalPages = Math.ceil(filterdOnlyProducts.length / limit);
    return res.status(201).json({
      success: true,
      products,
      totalPages,
    });
  }
);

export const generateRandomProducts = async (count: number = 10) => {
  const products = [];
  for (let i = 0; i < count; i++) {
    products.push({
      name: faker.commerce.productName(),
      photo: "uploads\\175d54eb-fe7a-4426-9cc2-c37117c6cd74.png",
      price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
      stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
      category: faker.commerce.department(),
      createdAt: new Date(faker.date.past()),
      updatedAt: new Date(faker.date.recent()),
      __v: 0,
    });
  }
  await Product.create(products);

  console.log("Products generated successfully");
};

export const deleteRandomProducts = async (count: number = 10) => {
  const products = await Product.find({}).skip(count);
  products.forEach(async (product) => {
    rm(product.photo, () => {
      console.log("old photo deleted");
    });
    await product.deleteOne();
  });
  console.log("Products deleted successfully");
};

// generateRandomProducts(40)

// deleteRandomProducts(4)
