import { ProductRepository } from "../repositories/ProductRepository";

type ProductFilters = {
  search?: string;
  status?: string;
};

export class ProductService {
  private repository = new ProductRepository();

  async list(filters?: ProductFilters) {
    return this.repository.findAll(filters);
  }

  async findById(id: string) {
    const product = await this.repository.findById(id);

    if (!product) {
      throw new Error("Produto não encontrado.");
    }

    return product;
  }

  async create(data: Record<string, unknown>) {
    if (!data.codigo || !data.nome) {
      throw new Error("Código e nome são obrigatórios.");
    }

    return this.repository.create(data);
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.repository.update(id, data);
  }

  async inactivate(id: string) {
    return this.repository.inactivate(id);
  }
}