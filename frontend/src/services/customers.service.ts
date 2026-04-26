import { api } from "../lib/api";

export type Customer = {
  id: number;
  nome: string;
  cpf_cnpj?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CustomerPayload = {
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  ativo?: boolean;
};

export async function listCustomers() {
  const response = await api.get<Customer[]>("/clientes");
  return response.data;
}

export async function getCustomerById(id: number) {
  const response = await api.get<Customer>(`/clientes/${id}`);
  return response.data;
}

export async function createCustomer(data: CustomerPayload) {
  const response = await api.post<Customer>("/clientes", data);
  return response.data;
}

export async function updateCustomer(id: number, data: Partial<CustomerPayload>) {
  const response = await api.put<Customer>(`/clientes/${id}`, data);
  return response.data;
}

export async function deleteCustomer(id: number) {
  const response = await api.delete<{ message: string }>(`/clientes/${id}`);
  return response.data;
}