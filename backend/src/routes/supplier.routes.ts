import { Router } from "express";
import { SupplierController } from "../controllers/SupplierController";

export const supplierRoutes = Router();
const supplierController = new SupplierController();

supplierRoutes.get("/", (req, res) => supplierController.index(req, res));
supplierRoutes.get("/:id", (req, res) => supplierController.show(req, res));
supplierRoutes.post("/", (req, res) => supplierController.create(req, res));
supplierRoutes.put("/:id", (req, res) => supplierController.update(req, res));
supplierRoutes.patch("/:id/inativar", (req, res) => supplierController.inactivate(req, res));