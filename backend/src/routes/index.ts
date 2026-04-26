import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { dashboardRoutes } from "./dashboard.routes";
import { movementRoutes } from "./movement.routes";
import { productRoutes } from "./product.routes";
import { productDetailsRoutes } from "./product-details.routes";
import { supplierRoutes } from "./supplier.routes";
import { userRoutes } from "./user.routes";
import { customerRoutes } from "./customer.routes";
import { adminMaintenanceRoutes } from "./admin-maintenance.routes";

export const routes = Router();

routes.use(authMiddleware);

routes.use("/produtos", productRoutes);
routes.use("/dashboard", dashboardRoutes);
routes.use("/movimentacoes", movementRoutes);
routes.use("/usuarios", userRoutes);
routes.use("/produtos-detalhes", productDetailsRoutes);
routes.use("/fornecedores", supplierRoutes);
routes.use("/clientes", customerRoutes);
routes.use("/admin", adminMaintenanceRoutes);