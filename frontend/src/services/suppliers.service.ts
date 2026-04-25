import { api } from "../lib/api";
import type {
  CreateSupplierPayload,
  Fornecedor,
  UpdateSupplierPayload,
} from "../types/suppliers";

export async function getSuppliers() {
  const response = await api.get<Fornecedor[]>("/fornecedores");
  return response.data;
}

export async function getSupplierById(id: string) {
  const response = await api.get<Fornecedor>(`/fornecedores/${id}`);
  return response.data;
}

export async function createSupplier(payload: CreateSupplierPayload) {
  const response = await api.post("/fornecedores", payload);
  return response.data;
}

export async function updateSupplier(id: string, payload: UpdateSupplierPayload) {
  const response = await api.put(`/fornecedores/${id}`, payload);
  return response.data;
}

export async function inactivateSupplier(id: string) {
  const response = await api.patch(`/fornecedores/${id}/inativar`);
  return response.data;
}