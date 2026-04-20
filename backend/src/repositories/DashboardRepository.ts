export class DashboardRepository {
  async getSummary() {
    return {
      totalProdutos: 248,
      produtosEmAlerta: 3,
      entradasHoje: 18,
      saidasHoje: 11,
      ultimasMovimentacoes: [
        {
          id: 1,
          data: "20/04/2026 08:15",
          produto: "Óleo 5W30 Sintético",
          tipo: "Entrada",
          quantidade: 12,
          usuario: "Flávio",
          observacao: "Compra semanal",
        },
        {
          id: 2,
          data: "20/04/2026 09:20",
          produto: "Filtro de Óleo Fiat",
          tipo: "Saída",
          quantidade: 2,
          usuario: "Carlos",
          observacao: "Venda balcão",
        },
        {
          id: 3,
          data: "20/04/2026 10:05",
          produto: "Pastilha de Freio Dianteira",
          tipo: "Saída",
          quantidade: 1,
          usuario: "Flávio",
          observacao: "Uso na oficina",
        },
      ],
      produtosAlerta: [
        {
          id: 1,
          codigo: "P-0001",
          nome: "Óleo 5W30 Sintético",
          localizacao: "A1-03",
          estoqueAtual: 8,
          estoqueMinimo: 10,
          status: "baixo",
        },
        {
          id: 3,
          codigo: "P-0003",
          nome: "Pastilha de Freio Dianteira",
          localizacao: "C1-02",
          estoqueAtual: 5,
          estoqueMinimo: 6,
          status: "baixo",
        },
        {
          id: 5,
          codigo: "P-0005",
          nome: "Aditivo para Radiador",
          localizacao: "A2-04",
          estoqueAtual: 3,
          estoqueMinimo: 5,
          status: "baixo",
        },
      ],
    };
  }
}