import { supabase } from "../utils/supabase";

type ListFilters = {
  search?: string;
  cidade?: string;
};

type SaveSupplierInput = {
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

export class SupplierRepository {
  async list(filters?: ListFilters) {
    let query = supabase.from("fornecedores").select("*").order("nome", { ascending: true });

    if (filters?.cidade) {
      query = query.eq("cidade", filters.cidade);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
    }

    let result = data ?? [];

    if (filters?.search) {
      const term = filters.search.toLowerCase();

      result = result.filter((item: any) =>
        [
          item.nome,
          item.nome_fantasia,
          item.cnpj,
          item.email,
          item.telefone,
          item.whatsapp,
          item.contato_responsavel,
          item.cidade,
          item.estado,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }

    return result;
  }

  async findById(id: string) {
    const { data, error } = await supabase.from("fornecedores").select("*").eq("id", id).single();

    if (error || !data) {
      throw new Error("Fornecedor não encontrado.");
    }

    return data;
  }

  async create(data: SaveSupplierInput) {
    const { data: created, error } = await supabase
      .from("fornecedores")
      .insert({
        nome: data.nome,
        nome_fantasia: data.nome_fantasia ?? null,
        cnpj: data.cnpj ?? null,
        email: data.email ?? null,
        telefone: data.telefone ?? null,
        whatsapp: data.whatsapp ?? null,
        contato_responsavel: data.contato_responsavel ?? null,
        cidade: data.cidade ?? null,
        estado: data.estado ?? null,
        observacoes: data.observacoes ?? null,
        ativo: data.ativo ?? true,
      })
      .select("*")
      .single();

    if (error || !created) {
      throw new Error(`Erro ao criar fornecedor: ${error?.message ?? "desconhecido"}`);
    }

    return created;
  }

  async update(id: string, data: SaveSupplierInput) {
    const { data: updated, error } = await supabase
      .from("fornecedores")
      .update({
        nome: data.nome,
        nome_fantasia: data.nome_fantasia ?? null,
        cnpj: data.cnpj ?? null,
        email: data.email ?? null,
        telefone: data.telefone ?? null,
        whatsapp: data.whatsapp ?? null,
        contato_responsavel: data.contato_responsavel ?? null,
        cidade: data.cidade ?? null,
        estado: data.estado ?? null,
        observacoes: data.observacoes ?? null,
        ativo: data.ativo ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      throw new Error(`Erro ao atualizar fornecedor: ${error?.message ?? "desconhecido"}`);
    }

    return updated;
  }

  async inactivate(id: string) {
    const { data, error } = await supabase
      .from("fornecedores")
      .update({
        ativo: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Erro ao inativar fornecedor: ${error?.message ?? "desconhecido"}`);
    }

    return data;
  }
}