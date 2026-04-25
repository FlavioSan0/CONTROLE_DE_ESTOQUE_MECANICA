import { Request, Response } from "express";
import { MovementService } from "../services/MovementService";

export class MovementController {
  async index(req: Request, res: Response) {
    try {
      const service = new MovementService();

      const result = await service.list({
        produto: typeof req.query.produto === "string" ? req.query.produto : undefined,
        tipo: typeof req.query.tipo === "string" ? req.query.tipo : undefined,
        dataInicial:
          typeof req.query.dataInicial === "string" ? req.query.dataInicial : undefined,
        dataFinal: typeof req.query.dataFinal === "string" ? req.query.dataFinal : undefined,
      });

      return res.json(result);
    } catch (error) {
      console.error("Erro ao listar movimentações:", error);
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível listar as movimentações.",
      });
    }
  }

  async getEntryOptions(_req: Request, res: Response) {
    try {
      const service = new MovementService();
      const result = await service.getEntryOptions();
      return res.json(result);
    } catch (error) {
      console.error("Erro ao carregar opções de entrada:", error);
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as opções de entrada.",
      });
    }
  }

  async getExitOptions(_req: Request, res: Response) {
    try {
      const service = new MovementService();
      const result = await service.getExitOptions();
      return res.json(result);
    } catch (error) {
      console.error("Erro ao carregar opções de saída:", error);
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as opções de saída.",
      });
    }
  }

  async getFilterOptions(_req: Request, res: Response) {
    try {
      const service = new MovementService();
      const result = await service.getFilterOptions();
      return res.json(result);
    } catch (error) {
      console.error("Erro ao carregar filtros de movimentação:", error);
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os filtros de movimentação.",
      });
    }
  }

  async createEntry(req: Request, res: Response) {
  try {
    const service = new MovementService();

    const result = await service.createEntry(
      {
        ...req.body,
        usuario_email: req.user?.email,
      },
      req.file as Express.Multer.File | undefined
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error("Erro ao registrar entrada:", error);
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "Não foi possível registrar a entrada.",
    });
  }
}

  async createExit(req: Request, res: Response) {
    try {
      const service = new MovementService();

      const result = await service.createExit({
        ...req.body,
        usuario_email: req.user?.email,
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error("Erro ao registrar saída:", error);
      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Não foi possível registrar a saída.",
      });
    }
  }
}