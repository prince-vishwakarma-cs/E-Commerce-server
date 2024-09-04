import express from "express";
import {
  allCategories,
  allProducts,
  deleteProduct,
  latestProduct,
  newProduct,
  productInfo,
  searchProducts,
  updateProduct,
} from "../controllers/product.js";
import { adminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

app.post("/new", singleUpload, newProduct);
app.get("/latest", latestProduct);
app.get("/categories", allCategories);
app.get("/admin/products", adminOnly, allProducts);
app.get("/all", searchProducts);
app
  .route("/:id")
  .get(productInfo)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
