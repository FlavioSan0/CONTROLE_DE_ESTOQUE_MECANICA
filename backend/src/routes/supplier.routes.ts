import { Router } from "express";
import { SupplierController } from "../controllers/SupplierController";

export const supplierRoutes = Router();

supplierRoutes.get("/", SupplierController.list);
supplierRoutes.post("/", SupplierController.create);
supplierRoutes.put("/:id", SupplierController.update);
supplierRoutes.delete("/:id", SupplierController.delete);