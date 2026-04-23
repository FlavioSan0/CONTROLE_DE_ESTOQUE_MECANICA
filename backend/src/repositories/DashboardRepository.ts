import { supabase } from "../utils/supabase";

export class DashboardRepository {
  async getSummary() {
    const [
      dashboardResponse,
      productsAlertResponse,
      movementsResponse,
    ] = await Promise.all([
      supabase.from("vw_dashboard_estoque").select("*").single(),
      supabase
        .from("vw_produtos_estoque")
        .select("*")
        .eq("status", "baixo")
        .order("nome", { ascending: true })
        .limit(5),
      supabase
        .from("movimentacoes_estoque")
        .select(`
          id,
          quantidade,
          observacoes,
          data_movimentacao,
          produtos:produto_id ( nome ),
          tipos_movimentacao:tipo_movimentacao_id ( nome, natureza )
        `)
        .order("data_movimentacao", { ascending: false })
        .limit(10),
    ]);

    if (dashboardResponse.error) {
      throw new Error(`Erro ao buscar resumo do dashboard: ${dashboardResponse.error.message}`);
    }

    if (productsAlertResponse.error) {
      throw new Error(`Erro ao buscar produtos em alerta: ${productsAlertResponse.error.message}`);
    }

    if (movementsResponse.error) {
      throw new Error(`Erro ao buscar movimentações: ${movementsResponse.error.message}`);
    }

    const dashboard = dashboardResponse.data;
    const productsAlert = productsAlertResponse.data ?? [];
    const movements = movementsResponse.data ?? [];

    return {
      totalProdutos: Number(dashboard?.total_produtos ?? 0),
      produtosEmAlerta: Number(dashboard?.produtos_em_alerta ?? 0),
      entradasHoje: Number(dashboard?.entradas_hoje ?? 0),
      saidasHoje: Number(dashboard?.saidas_hoje ?? 0),
      ultimasMovimentacoes: movements.map((item) => {
        const produto = Array.isArray(item.produtos) ? item.produtos[0] : item.produtos;
        const tipo = Array.isArray(item.tipos_movimentacao)
          ? item.tipos_movimentacao[0]
          : item.tipos_movimentacao;

        return {
          id: item.id,
          data: new Date(item.data_movimentacao).toLocaleString("pt-BR"),
          produto: produto?.nome ?? "Produto",
          tipo: tipo?.natureza === "entrada"
            ? "Entrada"
            : tipo?.natureza === "saida"
            ? "Saída"
            : "Ajuste",
          quantidade: Number(item.quantidade ?? 0),
          usuario: "Sistema",
          observacao: item.observacoes ?? tipo?.nome ?? "",
        };
      }),
      produtosAlerta: productsAlert.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        nome: item.nome,
        localizacao: item.localizacao ?? "",
        estoqueAtual: Number(item.estoque_atual ?? 0),
        estoqueMinimo: Number(item.estoque_minimo ?? 0),
        status: item.status === "baixo" ? "baixo" : "ok",
      })),
    };
  }
}