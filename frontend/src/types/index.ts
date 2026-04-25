export type Produto = {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  marca: string;
  fornecedor: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  preco: number;
  localizacao: string;
  status: "ok" | "baixo";
};

export type ProdutoDetalhe = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria_id: string;
  fornecedor_principal_id: string;
  unidade_medida_id: string;
  localizacao_id: string;
  marca: string | null;
  sku: string | null;
  ncm: string | null;
  custo_medio: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  controla_estoque: boolean;
  ativo: boolean;
};

export type Movimentacao = {
  id: string | number;
  data: string;
  produto: string;
  tipo: string;
  natureza?: string;
  quantidade: number;
  usuario: string;
  observacao: string;
  nota_fiscal_numero?: string | null;
  nota_fiscal_url?: string | null;
};

export type ProdutoAlerta = {
  id: string;
  codigo: string;
  nome: string;
  localizacao: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  status: "ok" | "baixo";
};

export type DashboardData = {
  totalProdutos: number;
  produtosEmAlerta: number;
  entradasHoje: number;
  saidasHoje: number;
  ultimasMovimentacoes: Movimentacao[];
  produtosAlerta: ProdutoAlerta[];
};

export type SelectOption = {
  id: string;
  nome: string;
};

export type ProductCreateOptions = {
  categorias: SelectOption[];
  fornecedores: SelectOption[];
  unidadesMedida: SelectOption[];
  localizacoes: SelectOption[];
};

export type CreateProductPayload = {
  codigo: string;
  nome: string;
  descricao?: string;
  categoria_id: string;
  fornecedor_principal_id: string;
  unidade_medida_id: string;
  localizacao_id: string;
  marca?: string;
  sku?: string;
  ncm?: string;
  custo_medio?: number;
  preco_venda?: number;
  estoque_atual?: number;
  estoque_minimo?: number;
  controla_estoque?: boolean;
  ativo?: boolean;
};

export type MovementProductOption = {
  id: string;
  nome: string;
  estoqueAtual: number;
  status: string;
};

export type MovementTypeOption = {
  id: string;
  nome: string;
};

export type EntryFormOptions = {
  produtos: MovementProductOption[];
  tiposEntrada: MovementTypeOption[];
};

export type ExitFormOptions = {
  produtos: MovementProductOption[];
  tiposSaida: MovementTypeOption[];
};

export type MovementFilterOptions = {
  produtos: SelectOption[];
  tipos: SelectOption[];
};

export type CreateEntryPayload = {
  produto_id: string;
  tipo_movimentacao_id: string;
  quantidade: number;
  custo_unitario: number;
  observacoes?: string;
};

export type CreateExitPayload = {
  produto_id: string;
  tipo_movimentacao_id: string;
  quantidade: number;
  observacoes?: string;
};

export type UsuarioSistema = {
  id: string;
  auth_user_id?: string | null;
  nome: string;
  email: string;
  perfil: "usuario" | "admin" | string;
  ativo: boolean;
  precisa_trocar_senha: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateUserPayload = {
  nome: string;
  email: string;
  perfil: string;
  senha_temporaria: string;
  ativo?: boolean;
};

export type UpdateUserPayload = {
  nome?: string;
  perfil?: string;
  ativo?: boolean;
  precisa_trocar_senha?: boolean;
  nova_senha_temporaria?: string;
};