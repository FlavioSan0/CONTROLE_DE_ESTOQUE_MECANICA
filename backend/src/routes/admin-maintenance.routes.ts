import { Router } from "express";
import { AdminMaintenanceController } from "../controllers/AdminMaintenanceController";

export const adminMaintenanceRoutes = Router();

adminMaintenanceRoutes.post(
  "/clear-data",
  AdminMaintenanceController.clearData
);