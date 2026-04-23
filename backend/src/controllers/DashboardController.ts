import { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService";

export class DashboardController {
  async index(req: Request, res: Response) {
    try {
      const service = new DashboardService();
      const result = await service.getData();

      return res.json(result);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);

      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao carregar dashboard.",
      });
    }
  }
}