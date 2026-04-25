import { ProductRepository } from "../repositories/ProductRepository";

type ProductFilters = {
  search?: string;
  status?: string;
  categoria?: string;
  fornecedor?: string;
};

type ProductInput = {
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

export class ProductService {
  private repository = new ProductRepository();

  async list(filters?: ProductFilters) {
    return this.repository.findAll(filters);
  }

  async findById(id: string) {
    return this.repository.findById(id);
  }

  async getCreateOptions() {
    return this.repository.getCreateOptions();
  }

  private normalizePayload(data: ProductInput) {
    if (!data.codigo?.trim()) throw new Error("Código é obrigatório.");
    if (!data.nome?.trim()) throw new Error("Nome é obrigatório.");
    if (!data.categoria_id) throw new Error("Categoria é obrigatória.");
    if (!data.fornecedor_principal_id) throw new Error("Fornecedor é obrigatório.");
    if (!data.unidade_medida_id) throw new Error("Unidade de medida é obrigatória.");
    if (!data.localizacao_id) throw new Error("Localização é obrigatória.");

    return {
      codigo: data.codigo.trim(),
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      categoria_id: data.categoria_id,
      fornecedor_principal_id: data.fornecedor_principal_id,
      unidade_medida_id: data.unidade_medida_id,
      localizacao_id: data.localizacao_id,
      marca: data.marca?.trim() || null,
      sku: data.sku?.trim() || null,
      ncm: data.ncm?.trim() || null,
      custo_medio: Number(data.custo_medio ?? 0),
      preco_venda: Number(data.preco_venda ?? 0),
      estoque_atual: Number(data.estoque_atual ?? 0),
      estoque_minimo: Number(data.estoque_minimo ?? 0),
      controla_estoque: Boolean(data.controla_estoque ?? true),
      ativo: Boolean(data.ativo ?? true),
    };
  }

  async create(data: ProductInput) {
    const payload = this.normalizePayload(data);
    return this.repository.create(payload);
  }

  async update(id: string, data: ProductInput) {
    const payload = this.normalizePayload(data);
    return this.repository.update(id, payload);
  }

  async inactivate(id: string) {
    return this.repository.inactivate(id);
  }
}