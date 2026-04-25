import { MovementRepository } from "../repositories/MovementRepository";

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
  custo_unitario?: number;
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

export class MovementService {
  private repository = new MovementRepository();

  async list(filters: ListFilters) {
    return this.repository.list(filters);
  }

  async getEntryOptions() {
    return this.repository.getEntryOptions();
  }

  async getExitOptions() {
    return this.repository.getExitOptions();
  }

  async getFilterOptions() {
    return this.repository.getFilterOptions();
  }

  async createEntry(data: CreateEntryInput) {
    if (!data.produto_id) throw new Error("Produto é obrigatório.");
    if (!data.tipo_movimentacao_id) throw new Error("Tipo de entrada é obrigatório.");
    if (!data.quantidade || Number(data.quantidade) <= 0) {
      throw new Error("A quantidade deve ser maior que zero.");
    }

    return this.repository.createEntry({
      ...data,
      quantidade: Number(data.quantidade),
      custo_unitario: Number(data.custo_unitario ?? 0),
    });
  }

  async createExit(data: CreateExitInput) {
    if (!data.produto_id) throw new Error("Produto é obrigatório.");
    if (!data.tipo_movimentacao_id) throw new Error("Tipo de saída é obrigatório.");
    if (!data.quantidade || Number(data.quantidade) <= 0) {
      throw new Error("A quantidade deve ser maior que zero.");
    }

    return this.repository.createExit({
      ...data,
      quantidade: Number(data.quantidade),
    });
  }
}