import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";

export const dashboardRoutes = Router();
const dashboardController = new DashboardController();

dashboardRoutes.get("/", (req, res) => dashboardController.index(req, res));