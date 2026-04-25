import { api } from "../lib/api";
import type {
  CreateProductPayload,
  ProductCreateOptions,
  Produto,
  ProdutoDetalhe,
} from "../types";

export async function getProducts() {
  const response = await api.get<Produto[]>("/produtos");
  return response.data;
}

export async function getProductById(id: string) {
  const response = await api.get<ProdutoDetalhe>(`/produtos/${id}`);
  return response.data;
}

export async function getProductCreateOptions() {
  const response = await api.get<ProductCreateOptions>("/produtos/opcoes-cadastro");
  return response.data;
}

export async function createProduct(payload: CreateProductPayload) {
  const response = await api.post("/produtos", payload);
  return response.data;
}

export async function updateProduct(id: string, payload: CreateProductPayload) {
  const response = await api.put(`/produtos/${id}`, payload);
  return response.data;
}

export async function inactivateProduct(id: string) {
  const response = await api.patch(`/produtos/${id}/inativar`);
  return response.data;
}