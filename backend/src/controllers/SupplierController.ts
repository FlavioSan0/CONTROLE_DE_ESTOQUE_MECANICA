import { Request, Response } from "express";
import { SupplierService } from "../services/SupplierService";

export class SupplierController {
  static async list(_request: Request, response: Response) {
    try {
      const suppliers = await SupplierService.list();
      return response.json(suppliers);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível listar os fornecedores.";

      return response.status(500).json({ error: message });
    }
  }

  static async create(request: Request, response: Response) {
    try {
      const supplier = await SupplierService.create(request.body);
      return response.status(201).json(supplier);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível criar o fornecedor.";

      return response.status(400).json({ error: message });
    }
  }

  static async update(request: Request, response: Response) {
    try {
      const id = Number(request.params.id);

      const supplier = await SupplierService.update(id, request.body);

      return response.json(supplier);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o fornecedor.";

      return response.status(400).json({ error: message });
    }
  }

  static async delete(request: Request, response: Response) {
    try {
      const id = Number(request.params.id);

      const result = await SupplierService.delete(id);

      return response.json(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o fornecedor.";

      return response.status(400).json({ error: message });
    }
  }
}