import { api } from "../lib/api";
import type { ProdutoDetalhes } from "../types/product-details";

export async function getProductDetails(productId: string) {
  const response = await api.get<ProdutoDetalhes>(`/produtos-detalhes/${productId}/detalhes`);
  return response.data;
}