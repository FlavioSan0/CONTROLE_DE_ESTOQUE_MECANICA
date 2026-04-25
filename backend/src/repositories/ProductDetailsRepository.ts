import { supabase } from "../utils/supabase";

export type ProductDetailsResponse = {
  produto: {
    id: string;
    codigo: string;
    nome: string;
    descricao?: string | null;
    categoria?: string | null;
    marca?: string | null;
    unidade_medida?: string | null;
    estoque_atual: number;
    estoque_minimo?: number | null;
    custo_unitario?: number | null;
    preco_venda?: number | null;
    fornecedor?: string | null;
    ativo?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  movimentacoes: Array<{
    id: string;
    data: string;
    tipo: string;
    natureza?: string | null;
    quantidade: number;
    observacao?: string | null;
    usuario?: string | null;
    custo_unitario?: number | null;
    nota_fiscal_numero?: string | null;
    nota_fiscal_url?: string | null;
  }>;
};

type ProdutoRow = {
  id: string;
  codigo: string | null;
  nome: string | null;
  descricao: string | null;
  categoria_id: string | null;
  marca: string | null;
  unidade_medida_id: string | null;
  estoque_atual: number | null;
  estoque_minimo: number | null;
  custo_medio: number | null;
  preco_venda: number | null;
  fornecedor_principal_id: string | null;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type CategoriaRow = {
  nome: string | null;
};

type UnidadeRow = {
  sigla: string | null;
  descricao: string | null;
};

type FornecedorRow = {
  nome: string | null;
};

type MovimentoProdutoRow = {
  id: string;
  data_movimentacao: string | null;
  quantidade: number | string | null;
  observacoes: string | null;
  custo_unitario: number | string | null;
  nota_fiscal_numero: string | null;
  nota_fiscal_url: string | null;
  tipos_movimentacao:
    | {
        nome: string | null;
        natureza: string | null;
      }
    | null;
  usuarios:
    | {
        nome: string | null;
      }
    | null;
};

export class ProductDetailsRepository {
  async getById(productId: string): Promise<ProductDetailsResponse> {
    const produtoRes = await supabase
      .from("produtos")
      .select(`
        id,
        codigo,
        nome,
        descricao,
        categoria_id,
        marca,
        unidade_medida_id,
        estoque_atual,
        estoque_minimo,
        custo_medio,
        preco_venda,
        fornecedor_principal_id,
        ativo,
        created_at,
        updated_at
      `)
      .eq("id", productId)
      .single<ProdutoRow>();

    if (produtoRes.error || !produtoRes.data) {
      throw new Error(produtoRes.error?.message || "Produto não encontrado.");
    }

    const produto = produtoRes.data;

    const [categoriaRes, unidadeRes, fornecedorRes, movRes] = await Promise.all([
      produto.categoria_id
        ? supabase
            .from("categorias")
            .select("nome")
            .eq("id", produto.categoria_id)
            .single<CategoriaRow>()
        : Promise.resolve({ data: null, error: null }),

      produto.unidade_medida_id
        ? supabase
            .from("unidades_medida")
            .select("sigla, descricao")
            .eq("id", produto.unidade_medida_id)
            .single<UnidadeRow>()
        : Promise.resolve({ data: null, error: null }),

      produto.fornecedor_principal_id
        ? supabase
            .from("fornecedores")
            .select("nome")
            .eq("id", produto.fornecedor_principal_id)
            .single<FornecedorRow>()
        : Promise.resolve({ data: null, error: null }),

      supabase
        .from("movimentacoes_estoque")
        .select(`
          id,
          data_movimentacao,
          quantidade,
          observacoes,
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
        .order("data_movimentacao", { ascending: false }),
    ]);

    if ("error" in movRes && movRes.error) {
      throw new Error(`Erro ao buscar movimentações do produto: ${movRes.error.message}`);
    }

    const categoriaData = "data" in categoriaRes ? categoriaRes.data : null;
    const unidadeData = "data" in unidadeRes ? unidadeRes.data : null;
    const fornecedorData = "data" in fornecedorRes ? fornecedorRes.data : null;

    return {
      produto: {
        id: String(produto.id),
        codigo: String(produto.codigo ?? ""),
        nome: String(produto.nome ?? ""),
        descricao: produto.descricao ?? null,
        categoria: categoriaData?.nome ?? null,
        marca: produto.marca ?? null,
        unidade_medida: unidadeData?.sigla ?? unidadeData?.descricao ?? null,
        estoque_atual: Number(produto.estoque_atual ?? 0),
        estoque_minimo: produto.estoque_minimo ?? null,
        custo_unitario: produto.custo_medio ?? null,
        preco_venda: produto.preco_venda ?? null,
        fornecedor: fornecedorData?.nome ?? null,
        ativo: produto.ativo ?? null,
        created_at: produto.created_at ?? null,
        updated_at: produto.updated_at ?? null,
      },
      movimentacoes: (((movRes as any).data ?? []) as MovimentoProdutoRow[]).map((item) => ({
        id: String(item.id),
        data: item.data_movimentacao ?? "",
        tipo: item.tipos_movimentacao?.nome ?? "Não identificado",
        natureza: item.tipos_movimentacao?.natureza ?? null,
        quantidade: Number(item.quantidade ?? 0),
        observacao: item.observacoes ?? null,
        usuario: item.usuarios?.nome ?? null,
        custo_unitario:
          item.custo_unitario !== null && item.custo_unitario !== undefined
            ? Number(item.custo_unitario)
            : null,
        nota_fiscal_numero: item.nota_fiscal_numero ?? null,
        nota_fiscal_url: item.nota_fiscal_url ?? null,
      })),
    };
  }
}