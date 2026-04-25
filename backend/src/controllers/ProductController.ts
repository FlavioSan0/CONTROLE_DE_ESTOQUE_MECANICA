import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";

function getParamAsString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export class ProductController {
  async index(req: Request, res: Response) {
    try {
      const service = new ProductService();

      const result = await service.list({
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        categoria: typeof req.query.categoria === "string" ? req.query.categoria : undefined,
        fornecedor: typeof req.query.fornecedor === "string" ? req.query.fornecedor : undefined,
      });

      return res.json(result);
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao listar produtos.",
      });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const id = getParamAsString(req.params.id);
      const service = new ProductService();
      const result = await service.findById(id);
      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao buscar produto.",
      });
    }
  }

  async options(req: Request, res: Response) {
    try {
      const service = new ProductService();
      const result = await service.getCreateOptions();
      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar opções:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao buscar opções.",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const service = new ProductService();
      const result = await service.create(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao criar produto.",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = getParamAsString(req.params.id);
      const service = new ProductService();
      const result = await service.update(id, req.body);
      return res.json(result);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao atualizar produto.",
      });
    }
  }

  async inactivate(req: Request, res: Response) {
    try {
      const id = getParamAsString(req.params.id);
      const service = new ProductService();
      const result = await service.inactivate(id);
      return res.json(result);
    } catch (error) {
      console.error("Erro ao inativar produto:", error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao inativar produto.",
      });
    }
  }
  
    async details(req: Request, res: Response) {
    try {
      const id = getParamAsString(req.params.id);
      const service = new ProductService();
      const result = await service.getDetails(id);

      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar detalhes do produto:", error);
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar detalhes do produto.",
      });
    }
  }
}