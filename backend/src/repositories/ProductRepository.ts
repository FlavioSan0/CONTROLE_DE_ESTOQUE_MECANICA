import { supabase } from "../utils/supabase";

type ProductFilters = {
  search?: string;
  status?: string;
  categoria?: string;
  fornecedor?: string;
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

    if (filters?.categoria && filters.categoria !== "todas") {
      query = query.eq("categoria", filters.categoria);
    }

    if (filters?.fornecedor && filters.fornecedor !== "todos") {
      query = query.eq("fornecedor", filters.fornecedor);
    }

    const { data, error } = await query.order("codigo", { ascending: true });

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

  async getCreateOptions() {
    const [categorias, fornecedores, unidades, localizacoes] = await Promise.all([
      supabase.from("categorias").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("fornecedores").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("unidades_medida").select("id, sigla, descricao").order("sigla"),
      supabase.from("localizacoes_estoque").select("id, codigo, descricao").eq("ativo", true).order("codigo"),
    ]);

    if (categorias.error) {
      throw new Error(`Erro ao buscar categorias: ${categorias.error.message}`);
    }

    if (fornecedores.error) {
      throw new Error(`Erro ao buscar fornecedores: ${fornecedores.error.message}`);
    }

    if (unidades.error) {
      throw new Error(`Erro ao buscar unidades de medida: ${unidades.error.message}`);
    }

    if (localizacoes.error) {
      throw new Error(`Erro ao buscar localizações: ${localizacoes.error.message}`);
    }

    return {
      categorias: categorias.data ?? [],
      fornecedores: fornecedores.data ?? [],
      unidadesMedida: (unidades.data ?? []).map((item) => ({
        id: item.id,
        nome: `${item.sigla} - ${item.descricao}`,
      })),
      localizacoes: (localizacoes.data ?? []).map((item) => ({
        id: item.id,
        nome: `${item.codigo} - ${item.descricao}`,
      })),
    };
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

  async getDetails(productId: string) {
  const produtoRes = await supabase
    .from("produtos")
    .select(`
      id,
      codigo,
      nome,
      descricao,
      categoria,
      marca,
      unidade_medida,
      estoque_atual,
      estoque_minimo,
      custo_unitario,
      preco_venda,
      fornecedor,
      ativo,
      created_at,
      updated_at
    `)
    .eq("id", productId)
    .single();

  if (produtoRes.error || !produtoRes.data) {
    throw new Error("Produto não encontrado.");
  }

  const movRes = await supabase
    .from("movimentacoes_estoque")
    .select(`
      id,
      created_at,
      quantidade,
      observacao,
      custo_unitario,
      nota_fiscal_numero,
      nota_fiscal_url,
      tipos_movimentacao:tipo_movimentacao_id (
        nome,
        natureza
      ),
      usuarios:usuario_id (
        nome
      )
    `)
    .eq("produto_id", productId)
    .order("created_at", { ascending: false });

  if (movRes.error) {
    throw new Error(`Erro ao buscar movimentações do produto: ${movRes.error.message}`);
  }

  return {
    produto: produtoRes.data,
    movimentacoes: (movRes.data ?? []).map((item: any) => ({
      id: String(item.id),
      data: item.created_at,
      tipo: item.tipos_movimentacao?.nome ?? "Não identificado",
      natureza: item.tipos_movimentacao?.natureza ?? null,
      quantidade: Number(item.quantidade ?? 0),
      observacao: item.observacao ?? null,
      usuario: item.usuarios?.nome ?? null,
      custo_unitario: item.custo_unitario ?? null,
      nota_fiscal_numero: item.nota_fiscal_numero ?? null,
      nota_fiscal_url: item.nota_fiscal_url ?? null,
    })),
  };
}
}