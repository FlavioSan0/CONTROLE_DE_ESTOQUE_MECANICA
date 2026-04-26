import { Request, Response } from "express";
import {
  AdminMaintenanceService,
  type ClearTarget,
} from "../services/AdminMaintenanceService";

export class AdminMaintenanceController {
  static async clearData(request: Request, response: Response) {
    try {
      const { target, confirmacao, adminPassword } = request.body ?? {};

      if (!target) {
        return response.status(400).json({
          error: "Tipo de limpeza não informado.",
        });
      }

      if (!confirmacao) {
        return response.status(400).json({
          error: "Confirmação não informada.",
        });
      }

      if (!adminPassword) {
        return response.status(400).json({
          error: "Senha do admin não informada.",
        });
      }

      const result = await AdminMaintenanceService.clearData(
        target as ClearTarget,
        confirmacao,
        adminPassword
      );

      return response.json(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível executar a limpeza.";

      return response.status(400).json({
        error: message,
      });
    }
  }
}