import { MovementRepository } from "../repositories/MovementRepository";
import { supabase } from "../utils/supabase";

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
  nota_fiscal_numero?: string;
  usuario_email?: string;
};

type CreateExitInput = {
  produto_id: string;
  tipo_movimentacao_id: string;
  quantidade: number;
  observacoes?: string;
  usuario_email?: string;
};

type UploadNotaFiscalResult = {
  caminho: string | null;
  nome_arquivo: string | null;
  url: string | null;
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

  async createEntry(data: CreateEntryInput, file?: Express.Multer.File) {
    if (!data.produto_id) throw new Error("Produto é obrigatório.");
    if (!data.tipo_movimentacao_id) throw new Error("Tipo de entrada é obrigatório.");
    if (!data.quantidade || Number(data.quantidade) <= 0) {
      throw new Error("A quantidade deve ser maior que zero.");
    }

    const quantidade = Number(data.quantidade);
    const custoUnitario = Number(data.custo_unitario ?? 0);

    if (!Number.isFinite(custoUnitario) || custoUnitario < 0) {
      throw new Error("O custo unitário não pode ser negativo.");
    }

    let notaFiscal: UploadNotaFiscalResult = {
      caminho: null,
      nome_arquivo: null,
      url: null,
    };

    if (file) {
      notaFiscal = await this.uploadNotaFiscal(file);
    }

    return this.repository.createEntry({
      ...data,
      quantidade,
      custo_unitario: custoUnitario,
      observacoes: data.observacoes?.trim() || "",
      nota_fiscal_numero: data.nota_fiscal_numero?.trim() || null,
      nota_fiscal_nome_arquivo: notaFiscal.nome_arquivo,
      nota_fiscal_caminho: notaFiscal.caminho,
      nota_fiscal_url: notaFiscal.url,
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
      observacoes: data.observacoes?.trim() || "",
    });
  }

  private async uploadNotaFiscal(file: Express.Multer.File): Promise<UploadNotaFiscalResult> {
    const nomeLimpo = file.originalname.replace(/\s+/g, "_");
    const caminho = `entradas/${Date.now()}-${nomeLimpo}`;

    const { error } = await supabase.storage
      .from("notas-fiscais")
      .upload(caminho, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erro ao enviar nota fiscal: ${error.message}`);
    }

    const { data } = supabase.storage.from("notas-fiscais").getPublicUrl(caminho);

    return {
      caminho,
      nome_arquivo: file.originalname,
      url: data.publicUrl,
    };
  }
}