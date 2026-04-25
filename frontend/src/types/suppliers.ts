export type Fornecedor = {
  id: string;
  nome: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  contato_responsavel?: string | null;
  cidade?: string | null;
  estado?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateSupplierPayload = {
  nome: string;
  nome_fantasia?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  contato_responsavel?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  ativo?: boolean;
};

export type UpdateSupplierPayload = CreateSupplierPayload;