import { supabase } from "../utils/supabase";

type ProductFilters = {
  search?: string;
  status?: string;
};

export class ProductRepository {
  async findAll(filters?: ProductFilters) {
    let query = supabase.from("vw_produtos_estoque").select("*");

    if (filters?.search) {
      const term = filters.search.trim();
      if (term) {
        query = query.or(
          `nome.ilike.%${term}%,codigo.ilike.%${term}%,marca.ilike.%${term}%,fornecedor.ilike.%${term}%,categoria.ilike.%${term}%`
        );
      }
    }

    if (filters?.status && filters.status !== "todos") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("nome", { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar produtos: ${error.message}`);
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      categoria: item.categoria ?? "",
      marca: item.marca ?? "",
      fornecedor: item.fornecedor ?? "",
      estoqueAtual: Number(item.estoque_atual ?? 0),
      estoqueMinimo: Number(item.estoque_minimo ?? 0),
      preco: Number(item.preco_venda ?? 0),
      localizacao: item.localizacao ?? "",
      status: item.status === "baixo" ? "baixo" : "ok",
    }));
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar produto: ${error.message}`);
    }

    return data;
  }

  async create(payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from("produtos")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar produto: ${error.message}`);
    }

    return data;
  }

  async update(id: string, payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from("produtos")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar produto: ${error.message}`);
    }

    return data;
  }

  async inactivate(id: string) {
    const { data, error } = await supabase
      .from("produtos")
      .update({ ativo: false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao inativar produto: ${error.message}`);
    }

    return data;
  }
}