import { Request, Response } from "express";
import { AdminMaintenanceService } from "../services/AdminMaintenanceService";

export const AdminMaintenanceController = {
  async clearData(request: Request, response: Response) {
    try {
      const body = request.body ?? {};

      const { target, confirmacao, senhaAdmin } = body;

      if (!target) {
        return response.status(400).json({
          error: "Informe o alvo da limpeza.",
        });
      }

      if (!confirmacao) {
        return response.status(400).json({
          error: "Informe a frase de confirmação.",
        });
      }

      if (!senhaAdmin) {
        return response.status(400).json({
          error: "Informe a senha do administrador.",
        });
      }

      const result = await AdminMaintenanceService.clearData({
        target,
        confirmacao,
        senhaAdmin,
      });

      return response.json(result);
    } catch (error) {
      console.error("Erro ao limpar dados:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível executar a limpeza.";

      return response.status(400).json({
        error: message,
      });
    }
  },
};