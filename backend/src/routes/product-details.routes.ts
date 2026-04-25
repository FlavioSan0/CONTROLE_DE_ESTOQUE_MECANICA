import { Router } from "express";
import { ProductDetailsController } from "../controllers/ProductDetailsController";

export const productDetailsRoutes = Router();
const productDetailsController = new ProductDetailsController();

productDetailsRoutes.get("/:id/detalhes", (req, res) =>
  productDetailsController.show(req, res)
);