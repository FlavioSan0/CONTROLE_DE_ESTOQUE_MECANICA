import {
  ProductDetailsRepository,
  ProductDetailsResponse,
} from "../repositories/ProductDetailsRepository";

export class ProductDetailsService {
  private repository: ProductDetailsRepository;

  constructor() {
    this.repository = new ProductDetailsRepository();
  }

  async execute(productId: string): Promise<ProductDetailsResponse> {
    if (!productId) {
      throw new Error("ID do produto é obrigatório.");
    }

    return this.repository.getById(productId);
  }
}