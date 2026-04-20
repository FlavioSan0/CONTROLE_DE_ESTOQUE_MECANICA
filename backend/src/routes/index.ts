import { Router } from "express";
import { productRoutes } from "./product.routes";
import { dashboardRoutes } from "./dashboard.routes";

export const routes = Router();

routes.use("/produtos", productRoutes);
routes.use("/dashboard", dashboardRoutes);