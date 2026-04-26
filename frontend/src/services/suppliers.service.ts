import { api } from "../lib/api";

export type SupplierPayload = {
  nome: string;
  nomeFantasia?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  contatoResponsavel?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  ativo?: boolean;
};

export async function listSuppliers() {
  const response = await api.get("/fornecedores");
  return response.data;
}

export async function createSupplier(data: SupplierPayload) {
  const response = await api.post("/fornecedores", data);
  return response.data;
}

export async function updateSupplier(id: number, data: Partial<SupplierPayload>) {
  const response = await api.put(`/fornecedores/${id}`, data);
  return response.data;
}

export async function deleteSupplier(id: number) {
  const response = await api.delete(`/fornecedores/${id}`);
  return response.data;
}