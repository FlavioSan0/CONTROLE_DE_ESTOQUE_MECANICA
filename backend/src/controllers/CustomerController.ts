import { Request, Response } from "express";
import { CustomerService } from "../services/CustomerService";

export class CustomerController {
  async index(_req: Request, res: Response) {
    try {
      const service = new CustomerService();
      const result = await service.list();

      return res.json(result);
    } catch (error) {
      console.error("Erro ao listar clientes:", error);

      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Erro ao listar clientes.",
      });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      const service = new CustomerService();
      const result = await service.findById(id);

      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);

      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao buscar cliente.",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const service = new CustomerService();
      const result = await service.create(req.body);

      return res.status(201).json(result);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);

      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao criar cliente.",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      const service = new CustomerService();
      const result = await service.update(id, req.body);

      return res.json(result);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);

      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao atualizar cliente.",
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      const service = new CustomerService();
      const result = await service.delete(id);

      return res.json(result);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);

      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao excluir cliente.",
      });
    }
  }
}