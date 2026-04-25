import { Request, Response } from "express";
import { ProductDetailsService } from "../services/ProductDetailsService";

function getParamAsString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

export class ProductDetailsController {
  async show(req: Request, res: Response) {
    try {
      const service = new ProductDetailsService();
      const id = getParamAsString(req.params.id);
      const result = await service.execute(id);

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