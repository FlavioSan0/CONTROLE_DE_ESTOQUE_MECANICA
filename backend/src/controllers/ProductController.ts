import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";

export class ProductController {
  async index(req: Request, res: Response) {
    try {
      const service = new ProductService();
      const produtos = await service.list();

      return res.json(produtos);
    } catch (error) {
      console.error("Erro no controller de produtos:", error);

      return res.status(500).json({
        error: "Erro ao listar produtos",
      });
    }
  }
}