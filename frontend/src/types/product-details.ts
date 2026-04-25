export type ProdutoDetalhes = {
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