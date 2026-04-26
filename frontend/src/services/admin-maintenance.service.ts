import { api } from "../lib/api";

export type ClearTarget =
  | "produtos"
  | "entradas"
  | "saidas"
  | "movimentacoes"
  | "fornecedores"
  | "clientes";

type ClearAdminDataResponse = {
  message: string;
};

export async function clearAdminData(
  target: ClearTarget,
  confirmacao: string,
  senhaAdmin: string
) {
  try {
    const response = await api.post<ClearAdminDataResponse>("/admin/clear-data", {
      target,
      confirmacao,
      senhaAdmin,
    });

    return response.data;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error ===
        "string"
    ) {
      throw new Error(
        (error as { response?: { data?: { error?: string } } }).response!.data!.error!
      );
    }

    throw error instanceof Error
      ? error
      : new Error("Não foi possível executar a limpeza.");
  }
}