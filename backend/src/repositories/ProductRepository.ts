type Produto = {
  id: number;
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

const productsMock: Produto[] = [
  {
    id: 1,
    codigo: "P-0001",
    nome: "Óleo 5W30 Sintético",
    categoria: "Lubrificantes",
    marca: "Mobil",
    fornecedor: "Auto Peças RN",
    estoqueAtual: 8,
    estoqueMinimo: 10,
    preco: 59.9,
    localizacao: "A1-03",
    status: "baixo",
  },
  {
    id: 2,
    codigo: "P-0002",
    nome: "Filtro de Óleo Fiat",
    categoria: "Filtros",
    marca: "Tecfil",
    fornecedor: "Distribuidora Nordeste",
    estoqueAtual: 22,
    estoqueMinimo: 8,
    preco: 24.9,
    localizacao: "B2-01",
    status: "ok",
  },
  {
    id: 3,
    codigo: "P-0003",
    nome: "Pastilha de Freio Dianteira",
    categoria: "Freios",
    marca: "Cobreq",
    fornecedor: "Auto Peças RN",
    estoqueAtual: 5,
    estoqueMinimo: 6,
    preco: 129.9,
    localizacao: "C1-02",
    status: "baixo",
  },
];

export class ProductRepository {
  async findAll() {
    return productsMock;
  }
}