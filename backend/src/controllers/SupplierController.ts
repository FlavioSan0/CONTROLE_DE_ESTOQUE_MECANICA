import { Request, Response } from "express";
import { SupplierService } from "../services/SupplierService";

function getParamAsString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export class SupplierController {
  async index(req: Request, res: Response) {
    try {
      const service = new SupplierService();

      const result = await service.list({
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        cidade: typeof req.query.cidade === "string" ? req.query.cidade : undefined,
      });

      return res.json(result);
    } catch (error) {
      console.error("Erro ao listar fornecedores:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao listar fornecedores.",
      });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const id = getParamAsString(req.params.id);
      const service = new SupplierService();
      const result = await service.findById(id);
      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar fornecedor:", error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao buscar fornecedor.",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const service = new SupplierService();
      const result = await service.create(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Erro ao criar fornecedor:", error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao criar fornecedor.",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = getParamAsString(req.params.id);
      const service = new SupplierService();
      const result = await service.update(id, req.body);
      return res.json(result);
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao atualizar fornecedor.",
      });
    }
  }

  async inactivate(req: Request, res: Response) {
    try {
      const id = getParamAsString(req.params.id);
      const service = new SupplierService();
      const result = await service.inactivate(id);
      return res.json(result);
    } catch (error) {
      console.error("Erro ao inativar fornecedor:", error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao inativar fornecedor.",
      });
    }
  }
}