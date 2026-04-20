import { ProductRepository } from "../repositories/ProductRepository";

export class ProductService {
  private repository = new ProductRepository();

  async list() {
    return this.repository.findAll();
  }
}