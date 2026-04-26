import {
  CustomerCreateInput,
  CustomerRepository,
  CustomerUpdateInput,
} from "../repositories/CustomerRepository";

function normalizeText(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase();

  return normalized ? normalized : null;
}

function normalizeState(value?: string | null) {
  const normalized = value?.trim().toUpperCase();

  return normalized ? normalized : null;
}

export class CustomerService {
  private repository: CustomerRepository;

  constructor() {
    this.repository = new CustomerRepository();
  }

  async list() {
    return this.repository.list();
  }

  async findById(id: number) {
    if (!id || Number.isNaN(id)) {
      throw new Error("ID do cliente inválido.");
    }

    const customer = await this.repository.findById(id);

    if (!customer) {
      throw new Error("Cliente não encontrado.");
    }

    return customer;
  }

  async create(data: CustomerCreateInput) {
    const nome = normalizeText(data.nome);

    if (!nome) {
      throw new Error("O nome do cliente é obrigatório.");
    }

    const payload: CustomerCreateInput = {
      nome,
      cpf_cnpj: normalizeText(data.cpf_cnpj),
      telefone: normalizeText(data.telefone),
      whatsapp: normalizeText(data.whatsapp),
      email: normalizeEmail(data.email),
      endereco: normalizeText(data.endereco),
      bairro: normalizeText(data.bairro),
      cidade: normalizeText(data.cidade),
      estado: normalizeState(data.estado),
      observacoes: normalizeText(data.observacoes),
      ativo: data.ativo ?? true,
    };

    return this.repository.create(payload);
  }

  async update(id: number, data: CustomerUpdateInput) {
    if (!id || Number.isNaN(id)) {
      throw new Error("ID do cliente inválido.");
    }

    const existingCustomer = await this.repository.findById(id);

    if (!existingCustomer) {
      throw new Error("Cliente não encontrado.");
    }

    const payload: CustomerUpdateInput = {};

    if (data.nome !== undefined) {
      const nome = normalizeText(data.nome);

      if (!nome) {
        throw new Error("O nome do cliente é obrigatório.");
      }

      payload.nome = nome;
    }

    if (data.cpf_cnpj !== undefined) {
      payload.cpf_cnpj = normalizeText(data.cpf_cnpj);
    }

    if (data.telefone !== undefined) {
      payload.telefone = normalizeText(data.telefone);
    }

    if (data.whatsapp !== undefined) {
      payload.whatsapp = normalizeText(data.whatsapp);
    }

    if (data.email !== undefined) {
      payload.email = normalizeEmail(data.email);
    }

    if (data.endereco !== undefined) {
      payload.endereco = normalizeText(data.endereco);
    }

    if (data.bairro !== undefined) {
      payload.bairro = normalizeText(data.bairro);
    }

    if (data.cidade !== undefined) {
      payload.cidade = normalizeText(data.cidade);
    }

    if (data.estado !== undefined) {
      payload.estado = normalizeState(data.estado);
    }

    if (data.observacoes !== undefined) {
      payload.observacoes = normalizeText(data.observacoes);
    }

    if (data.ativo !== undefined) {
      payload.ativo = data.ativo;
    }

    return this.repository.update(id, payload);
  }

  async delete(id: number) {
    if (!id || Number.isNaN(id)) {
      throw new Error("ID do cliente inválido.");
    }

    const existingCustomer = await this.repository.findById(id);

    if (!existingCustomer) {
      throw new Error("Cliente não encontrado.");
    }

    return this.repository.delete(id);
  }
}