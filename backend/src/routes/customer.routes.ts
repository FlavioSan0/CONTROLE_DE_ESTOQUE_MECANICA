import { Router } from "express";
import { CustomerController } from "../controllers/CustomerController";

export const customerRoutes = Router();

const controller = new CustomerController();

customerRoutes.get("/", controller.index);
customerRoutes.get("/:id", controller.show);
customerRoutes.post("/", controller.create);
customerRoutes.put("/:id", controller.update);
customerRoutes.delete("/:id", controller.delete);