import { Router } from "express";
import { ProductController } from "../controllers/ProductController";

export const productRoutes = Router();
const productController = new ProductController();

productRoutes.get("/opcoes-cadastro", (req, res) => productController.options(req, res));
productRoutes.get("/", (req, res) => productController.index(req, res));
productRoutes.get("/:id", (req, res) => productController.show(req, res));
productRoutes.post("/", (req, res) => productController.create(req, res));
productRoutes.put("/:id", (req, res) => productController.update(req, res));
productRoutes.patch("/:id/inativar", (req, res) => productController.inactivate(req, res));