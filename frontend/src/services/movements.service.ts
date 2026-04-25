import { api } from "../lib/api";
import type {
  CreateEntryPayload,
  CreateExitPayload,
  EntryFormOptions,
  ExitFormOptions,
  MovementFilterOptions,
  Movimentacao,
} from "../types";

export async function getEntryFormOptions() {
  const response = await api.get<EntryFormOptions>("/movimentacoes/opcoes-entrada");
  return response.data;
}

export async function getExitFormOptions() {
  const response = await api.get<ExitFormOptions>("/movimentacoes/opcoes-saida");
  return response.data;
}

export async function getMovementFilterOptions() {
  const response = await api.get<MovementFilterOptions>("/movimentacoes/opcoes-filtros");
  return response.data;
}

/**
 * Alias para manter compatibilidade com componentes
 * que usam o nome getFilterOptions.
 */
export async function getFilterOptions() {
  return getMovementFilterOptions();
}

export async function getMovements(params?: {
  produto?: string;
  tipo?: string;
  dataInicial?: string;
  dataFinal?: string;
}) {
  const response = await api.get<Movimentacao[]>("/movimentacoes", { params });
  return response.data;
}

export async function createEntry(payload: CreateEntryPayload) {
  const response = await api.post("/movimentacoes/entrada", payload);
  return response.data;
}

export async function createExit(payload: CreateExitPayload) {
  const response = await api.post("/movimentacoes/saida", payload);
  return response.data;
}

export async function createEntryWithInvoice(payload: FormData) {
  const response = await api.post("/movimentacoes/entradas", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}