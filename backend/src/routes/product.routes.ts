import { Router } from "express";
import { ProductController } from "../controllers/ProductController";

export const productRoutes = Router();
const productController = new ProductController();

productRoutes.get("/", (req, res) => productController.index(req, res));