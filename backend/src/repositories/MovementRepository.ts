import { supabase } from "../utils/supabase";

type ListFilters = {
  produto?: string;
  tipo?: string;
  dataInicial?: string;
  dataFinal?: string;
};

type CreateEntryInput = {
  produto_id: string;
  tipo_movimentacao_id: string;
  quantidade: number;
  custo_unitario: number;
  observacoes?: string;
  usuario_email?: string;
  nota_fiscal_numero?: string | null;
  nota_fiscal_nome_arquivo?: string | null;
  nota_fiscal_caminho?: string | null;
  nota_fiscal_url?: string | null;
};

type CreateExitInput = {
  produto_id: string;
  tipo_movimentacao_id: string;
  quantidade: number;
  observacoes?: string;
  usuario_email?: string;
};

type SupabaseRelation<T> = T | T[] | null;

type ProdutoOptionRow = {
  id: string;
  nome: string | null;
  estoque_atual: number | string | null;
  estoque_minimo: number | string | null;
  ativo: boolean | null;
};

type TipoMovimentacaoOptionRow = {
  id: string;
  nome: string | null;
  natureza?: string | null;
  ativo?: boolean | null;
};

type FilterProdutoRow = {
  id: string;
  nome: string | null;
};

type FilterTipoRow = {
  id: string;
  nome: string | null;
};

type MovimentoRow = {
  id: string;
  produto_id: string;
  tipo_movimentacao_id: string;
  quantidade: number | string | null;
  observacoes: string | null;
  data_movimentacao: string | null;
  nota_fiscal_numero: string | null;
  nota_fiscal_url: string | null;
  produtos: SupabaseRelation<{
    nome: string | null;
  }>;
  tipos_movimentacao: SupabaseRelation<{
    nome: string | null;
    natureza: string | null;
  }>;
  usuarios: SupabaseRelation<{
    nome: string | null;
  }>;
};

function getRelationItem<T>(relation: SupabaseRelation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

export class MovementRepository {
  async list(filters: ListFilters) {
    let query = supabase
      .from("movimentacoes_estoque")
      .select(`
        id,
        produto_id,
        tipo_movimentacao_id,
        quantidade,
        observacoes,
        data_movimentacao,
        nota_fiscal_numero,
        nota_fiscal_url,
        produtos:produto_id (
          nome
        ),
        tipos_movimentacao:tipo_movimentacao_id (
          nome,
          natureza
        ),
        usuarios:usuario_id (
          nome
        )
      `)
      .order("data_movimentacao", { ascending: false });

    if (filters.produto) {
      query = query.eq("produto_id", filters.produto);
    }

    if (filters.tipo) {
      query = query.eq("tipo_movimentacao_id", filters.tipo);
    }

    if (filters.dataInicial) {
      query = query.gte("data_movimentacao", `${filters.dataInicial}T00:00:00`);
    }

    if (filters.dataFinal) {
      query = query.lte("data_movimentacao", `${filters.dataFinal}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar movimentações: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as MovimentoRow[];

    return rows.map((item) => {
      const produto = getRelationItem(item.produtos);
      const tipoMovimentacao = getRelationItem(item.tipos_movimentacao);
      const usuario = getRelationItem(item.usuarios);

      return {
        id: item.id,
        data: item.data_movimentacao,
        produto: produto?.nome ?? "-",
        tipo: tipoMovimentacao?.nome ?? "-",
        natureza: tipoMovimentacao?.natureza ?? "",
        quantidade: Number(item.quantidade ?? 0),
        usuario: usuario?.nome ?? "-",
        observacao: item.observacoes ?? "",
        nota_fiscal_numero: item.nota_fiscal_numero ?? null,
        nota_fiscal_url: item.nota_fiscal_url ?? null,
      };
    });
  }

  async getEntryOptions() {
    const [produtosRes, tiposRes] = await Promise.all([
      supabase
        .from("produtos")
        .select("id, nome, estoque_atual, estoque_minimo, ativo")
        .eq("ativo", true)
        .order("codigo", { ascending: true }),
      supabase
        .from("tipos_movimentacao")
        .select("id, nome, natureza, ativo")
        .eq("ativo", true)
        .eq("natureza", "entrada")
        .order("nome", { ascending: true }),
    ]);

    if (produtosRes.error) {
      throw new Error(`Erro ao carregar produtos para entrada: ${produtosRes.error.message}`);
    }

    if (tiposRes.error) {
      throw new Error(`Erro ao carregar tipos de entrada: ${tiposRes.error.message}`);
    }

    return {
      produtos: ((produtosRes.data ?? []) as ProdutoOptionRow[]).map((item) => {
        const estoqueAtual = Number(item.estoque_atual ?? 0);
        const estoqueMinimo = Number(item.estoque_minimo ?? 0);

        return {
          id: item.id,
          nome: item.nome ?? "-",
          estoqueAtual,
          status: estoqueAtual <= estoqueMinimo ? "baixo" : "ok",
        };
      }),
      tiposEntrada: ((tiposRes.data ?? []) as TipoMovimentacaoOptionRow[]).map((item) => ({
        id: item.id,
        nome: item.nome ?? "-",
      })),
    };
  }

  async getExitOptions() {
    const [produtosRes, tiposRes] = await Promise.all([
      supabase
        .from("produtos")
        .select("id, nome, estoque_atual, estoque_minimo, ativo")
        .eq("ativo", true)
        .order("codigo", { ascending: true }),
      supabase
        .from("tipos_movimentacao")
        .select("id, nome, natureza, ativo")
        .eq("ativo", true)
        .eq("natureza", "saida")
        .order("nome", { ascending: true }),
    ]);

    if (produtosRes.error) {
      throw new Error(`Erro ao carregar produtos para saída: ${produtosRes.error.message}`);
    }

    if (tiposRes.error) {
      throw new Error(`Erro ao carregar tipos de saída: ${tiposRes.error.message}`);
    }

    return {
      produtos: ((produtosRes.data ?? []) as ProdutoOptionRow[]).map((item) => {
        const estoqueAtual = Number(item.estoque_atual ?? 0);
        const estoqueMinimo = Number(item.estoque_minimo ?? 0);

        return {
          id: item.id,
          nome: item.nome ?? "-",
          estoqueAtual,
          status: estoqueAtual <= estoqueMinimo ? "baixo" : "ok",
        };
      }),
      tiposSaida: ((tiposRes.data ?? []) as TipoMovimentacaoOptionRow[]).map((item) => ({
        id: item.id,
        nome: item.nome ?? "-",
      })),
    };
  }

  async getFilterOptions() {
    const [produtosRes, tiposRes] = await Promise.all([
      supabase
        .from("produtos")
        .select("id, nome")
        .eq("ativo", true)
        .order("codigo", { ascending: true }),
      supabase
        .from("tipos_movimentacao")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome", { ascending: true }),
    ]);

    if (produtosRes.error) {
      throw new Error(`Erro ao carregar produtos para filtros: ${produtosRes.error.message}`);
    }

    if (tiposRes.error) {
      throw new Error(`Erro ao carregar tipos para filtros: ${tiposRes.error.message}`);
    }

    return {
      produtos: ((produtosRes.data ?? []) as FilterProdutoRow[]).map((item) => ({
        id: item.id,
        nome: item.nome ?? "-",
      })),
      tipos: ((tiposRes.data ?? []) as FilterTipoRow[]).map((item) => ({
        id: item.id,
        nome: item.nome ?? "-",
      })),
    };
  }

  async createEntry(data: CreateEntryInput) {
    const usuarioId = await this.getUserIdByEmail(data.usuario_email);

    const produtoRes = await supabase
      .from("produtos")
      .select("id, estoque_atual")
      .eq("id", data.produto_id)
      .single();

    if (produtoRes.error || !produtoRes.data) {
      throw new Error("Produto não encontrado.");
    }

    const estoqueAtual = Number(produtoRes.data.estoque_atual ?? 0);
    const novoEstoque = estoqueAtual + Number(data.quantidade);

    const insertRes = await supabase.from("movimentacoes_estoque").insert({
      produto_id: data.produto_id,
      tipo_movimentacao_id: data.tipo_movimentacao_id,
      usuario_id: usuarioId,
      quantidade: Number(data.quantidade),
      custo_unitario: Number(data.custo_unitario ?? 0),
      observacoes: data.observacoes ?? "",
      data_movimentacao: new Date().toISOString(),
      nota_fiscal_numero: data.nota_fiscal_numero ?? null,
      nota_fiscal_nome_arquivo: data.nota_fiscal_nome_arquivo ?? null,
      nota_fiscal_caminho: data.nota_fiscal_caminho ?? null,
      nota_fiscal_url: data.nota_fiscal_url ?? null,
    });

    if (insertRes.error) {
      throw new Error(`Erro ao registrar entrada: ${insertRes.error.message}`);
    }

    const updateRes = await supabase
      .from("produtos")
      .update({
        estoque_atual: novoEstoque,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.produto_id);

    if (updateRes.error) {
      throw new Error(`Erro ao atualizar estoque do produto: ${updateRes.error.message}`);
    }

    return { success: true };
  }

  async createExit(data: CreateExitInput) {
    const usuarioId = await this.getUserIdByEmail(data.usuario_email);

    const produtoRes = await supabase
      .from("produtos")
      .select("id, estoque_atual")
      .eq("id", data.produto_id)
      .single();

    if (produtoRes.error || !produtoRes.data) {
      throw new Error("Produto não encontrado.");
    }

    const estoqueAtual = Number(produtoRes.data.estoque_atual ?? 0);

    if (Number(data.quantidade) > estoqueAtual) {
      throw new Error("Quantidade de saída maior que o estoque disponível.");
    }

    const novoEstoque = estoqueAtual - Number(data.quantidade);

    const insertRes = await supabase.from("movimentacoes_estoque").insert({
      produto_id: data.produto_id,
      tipo_movimentacao_id: data.tipo_movimentacao_id,
      usuario_id: usuarioId,
      quantidade: Number(data.quantidade),
      observacoes: data.observacoes ?? "",
      data_movimentacao: new Date().toISOString(),
    });

    if (insertRes.error) {
      throw new Error(`Erro ao registrar saída: ${insertRes.error.message}`);
    }

    const updateRes = await supabase
      .from("produtos")
      .update({
        estoque_atual: novoEstoque,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.produto_id);

    if (updateRes.error) {
      throw new Error(`Erro ao atualizar estoque do produto: ${updateRes.error.message}`);
    }

    return { success: true };
  }

  private async getUserIdByEmail(email?: string) {
    if (!email) {
      throw new Error("Usuário autenticado não encontrado.");
    }

    const userRes = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (userRes.error || !userRes.data) {
      throw new Error("Usuário do sistema não encontrado.");
    }

    return userRes.data.id;
  }
}