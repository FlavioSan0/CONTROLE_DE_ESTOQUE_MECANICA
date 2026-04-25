import { SupplierRepository } from "../repositories/SupplierRepository";

type ListFilters = {
  search?: string;
  cidade?: string;
};

type SaveSupplierInput = {
  nome: string;
  nome_fantasia?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  contato_responsavel?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  ativo?: boolean;
};

export class SupplierService {
  private repository = new SupplierRepository();

  async list(filters?: ListFilters) {
    return this.repository.list(filters);
  }

  async findById(id: string) {
    if (!id) throw new Error("ID do fornecedor é obrigatório.");
    return this.repository.findById(id);
  }

  async create(data: SaveSupplierInput) {
    const payload = this.normalizeSupplierPayload(data);

    if (!payload.nome) {
      throw new Error("O nome do fornecedor é obrigatório.");
    }

    return this.repository.create(payload);
  }

  async update(id: string, data: SaveSupplierInput) {
    if (!id) throw new Error("ID do fornecedor é obrigatório.");

    const payload = this.normalizeSupplierPayload(data);

    if (!payload.nome) {
      throw new Error("O nome do fornecedor é obrigatório.");
    }

    return this.repository.update(id, payload);
  }

  async inactivate(id: string) {
    if (!id) throw new Error("ID do fornecedor é obrigatório.");
    return this.repository.inactivate(id);
  }

  private normalizeSupplierPayload(data: SaveSupplierInput): SaveSupplierInput {
    const nome = data.nome?.trim() ?? "";
    const nome_fantasia = data.nome_fantasia?.trim() || undefined;
    const cnpj = data.cnpj?.trim() || undefined;
    const email = data.email?.trim() || undefined;
    const telefone = data.telefone?.trim() || undefined;
    const whatsapp = data.whatsapp?.trim() || undefined;
    const contato_responsavel = data.contato_responsavel?.trim() || undefined;
    const cidade = data.cidade?.trim() || undefined;
    const observacoes = data.observacoes?.trim() || undefined;

    let estado = data.estado?.trim().toUpperCase() || undefined;

    if (estado && estado.length !== 2) {
      throw new Error("O campo estado deve conter a UF com 2 letras, ex.: RN.");
    }

    return {
      nome,
      nome_fantasia,
      cnpj,
      email,
      telefone,
      whatsapp,
      contato_responsavel,
      cidade,
      estado,
      observacoes,
      ativo: data.ativo ?? true,
    };
  }
}