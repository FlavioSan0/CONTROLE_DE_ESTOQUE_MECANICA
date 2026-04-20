import { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService";

export class DashboardController {
  async index(req: Request, res: Response) {
    try {
      const service = new DashboardService();
      const dashboard = await service.getData();

      return res.json(dashboard);
    } catch (error) {
      console.error("Erro no dashboard:", error);

      return res.status(500).json({
        error: "Erro ao carregar dashboard",
      });
    }
  }
}