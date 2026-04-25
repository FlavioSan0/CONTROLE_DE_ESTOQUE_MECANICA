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
};

type CreateExitInput = {
  produto_id: string;
  tipo_movimentacao_id: string;
  quantidade: number;
  observacoes?: string;
  usuario_email?: string;
};

export class MovementRepository {
  async list(filters: ListFilters) {
    let query = supabase
      .from("vw_movimentacoes_estoque")
      .select("*")
      .order("data", { ascending: false });

    if (filters.produto) {
      query = query.eq("produto_id", filters.produto);
    }

    if (filters.tipo) {
      query = query.eq("tipo_movimentacao_id", filters.tipo);
    }

    if (filters.dataInicial) {
      query = query.gte("data", `${filters.dataInicial}T00:00:00`);
    }

    if (filters.dataFinal) {
      query = query.lte("data", `${filters.dataFinal}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar movimentações: ${error.message}`);
    }

    return (data ?? []).map((item: any) => ({
      id: item.id,
      data: item.data,
      produto: item.produto_nome ?? item.produto ?? "-",
      tipo: item.tipo_movimentacao_nome ?? item.tipo ?? "-",
      natureza: item.natureza ?? "",
      quantidade: Number(item.quantidade ?? 0),
      usuario: item.usuario_nome ?? item.usuario ?? "-",
      observacao: item.observacoes ?? item.observacao ?? "",
    }));
  }

  async getEntryOptions() {
    const [produtosRes, tiposRes] = await Promise.all([
      supabase
        .from("produtos")
        .select("id, nome, estoque_atual, ativo")
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
      produtos: (produtosRes.data ?? []).map((item: any) => ({
        id: item.id,
        nome: item.nome,
        estoqueAtual: Number(item.estoque_atual ?? 0),
        status: "ok",
      })),
      tiposEntrada: (tiposRes.data ?? []).map((item: any) => ({
        id: item.id,
        nome: item.nome,
      })),
    };
  }

  async getExitOptions() {
    const [produtosRes, tiposRes] = await Promise.all([
      supabase
        .from("produtos")
        .select("id, nome, estoque_atual, ativo")
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
      produtos: (produtosRes.data ?? []).map((item: any) => ({
        id: item.id,
        nome: item.nome,
        estoqueAtual: Number(item.estoque_atual ?? 0),
        status: "ok",
      })),
      tiposSaida: (tiposRes.data ?? []).map((item: any) => ({
        id: item.id,
        nome: item.nome,
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
      produtos: (produtosRes.data ?? []).map((item: any) => ({
        id: item.id,
        nome: item.nome,
      })),
      tipos: (tiposRes.data ?? []).map((item: any) => ({
        id: item.id,
        nome: item.nome,
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