import { supabase } from "../lib/supabase";

export type SupplierPayload = {
  nome?: string;
  nomeFantasia?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  contatoResponsavel?: string | null;
  contato_responsavel?: string | null;
  cidade?: string | null;
  estado?: string | null;
  observacoes?: string | null;
  ativo?: boolean;
};

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function mapSupplierFromDatabase(item: any) {
  return {
    id: item.id,
    nome: item.nome ?? "",
    nomeFantasia: item.nome_fantasia ?? "",
    cnpj: item.cnpj ?? "",
    email: item.email ?? "",
    telefone: item.telefone ?? "",
    whatsapp: item.whatsapp ?? "",
    contatoResponsavel: item.contato_responsavel ?? "",
    cidade: item.cidade ?? "",
    estado: item.estado ?? "",
    observacoes: item.observacoes ?? "",
    ativo: item.ativo ?? true,
  };
}

function supplierSelectFields() {
  return `
    id,
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
    ativo
  `;
}

function buildCreatePayload(payload: SupplierPayload) {
  return {
    nome: cleanText(payload.nome),
    nome_fantasia: cleanText(payload.nomeFantasia ?? payload.nome_fantasia),
    cnpj: cleanText(payload.cnpj),
    email: cleanText(payload.email)?.toLowerCase() ?? null,
    telefone: cleanText(payload.telefone),
    whatsapp: cleanText(payload.whatsapp),
    contato_responsavel: cleanText(
      payload.contatoResponsavel ?? payload.contato_responsavel
    ),
    cidade: cleanText(payload.cidade),
    estado: cleanText(payload.estado)?.toUpperCase() ?? null,
    observacoes: cleanText(payload.observacoes),
    ativo: payload.ativo ?? true,
  };
}

function buildUpdatePayload(payload: SupplierPayload) {
  const updatePayload: Record<string, unknown> = {};

  if (payload.nome !== undefined) {
    updatePayload.nome = cleanText(payload.nome);
  }

  if (payload.nomeFantasia !== undefined || payload.nome_fantasia !== undefined) {
    updatePayload.nome_fantasia = cleanText(
      payload.nomeFantasia ?? payload.nome_fantasia
    );
  }

  if (payload.cnpj !== undefined) {
    updatePayload.cnpj = cleanText(payload.cnpj);
  }

  if (payload.email !== undefined) {
    updatePayload.email = cleanText(payload.email)?.toLowerCase() ?? null;
  }

  if (payload.telefone !== undefined) {
    updatePayload.telefone = cleanText(payload.telefone);
  }

  if (payload.whatsapp !== undefined) {
    updatePayload.whatsapp = cleanText(payload.whatsapp);
  }

  if (
    payload.contatoResponsavel !== undefined ||
    payload.contato_responsavel !== undefined
  ) {
    updatePayload.contato_responsavel = cleanText(
      payload.contatoResponsavel ?? payload.contato_responsavel
    );
  }

  if (payload.cidade !== undefined) {
    updatePayload.cidade = cleanText(payload.cidade);
  }

  if (payload.estado !== undefined) {
    updatePayload.estado = cleanText(payload.estado)?.toUpperCase() ?? null;
  }

  if (payload.observacoes !== undefined) {
    updatePayload.observacoes = cleanText(payload.observacoes);
  }

  if (payload.ativo !== undefined) {
    updatePayload.ativo = payload.ativo;
  }

  return updatePayload;
}

export class SupplierService {
  static async list() {
    const { data, error } = await supabase
      .from("fornecedores")
      .select(supplierSelectFields())
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar fornecedores: ${error.message}`);
    }

    return (data ?? []).map(mapSupplierFromDatabase);
  }

  static async create(payload: SupplierPayload) {
    const dbPayload = buildCreatePayload(payload);

    if (!dbPayload.nome) {
      throw new Error("Informe o nome do fornecedor.");
    }

    const { data, error } = await supabase
      .from("fornecedores")
      .insert(dbPayload)
      .select(supplierSelectFields())
      .single();

    if (error) {
      throw new Error(`Erro ao criar fornecedor: ${error.message}`);
    }

    return mapSupplierFromDatabase(data);
  }

  static async update(id: number, payload: SupplierPayload) {
    if (!Number.isFinite(id)) {
      throw new Error("ID do fornecedor inválido.");
    }

    const dbPayload = buildUpdatePayload(payload);

    if (Object.keys(dbPayload).length === 0) {
      throw new Error("Nenhum dado enviado para atualizar.");
    }

    if ("nome" in dbPayload && !dbPayload.nome) {
      throw new Error("Informe o nome do fornecedor.");
    }

    const { data, error } = await supabase
      .from("fornecedores")
      .update(dbPayload)
      .eq("id", id)
      .select(supplierSelectFields())
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar fornecedor: ${error.message}`);
    }

    return mapSupplierFromDatabase(data);
  }

  static async delete(id: number) {
    if (!Number.isFinite(id)) {
      throw new Error("ID do fornecedor inválido.");
    }

    const { error } = await supabase
      .from("fornecedores")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Erro ao excluir fornecedor: ${error.message}`);
    }

    return {
      message: "Fornecedor excluído com sucesso.",
    };
  }
}