import { supabase } from "../lib/supabase";

export type ClearTarget =
  | "produtos"
  | "entradas"
  | "saidas"
  | "movimentacoes"
  | "fornecedores"
  | "clientes";

type ClearResult = {
  message: string;
};

const confirmationMap: Record<ClearTarget, string> = {
  produtos: "LIMPAR PRODUTOS",
  entradas: "LIMPAR ENTRADAS",
  saidas: "LIMPAR SAIDAS",
  movimentacoes: "LIMPAR MOVIMENTACOES",
  fornecedores: "LIMPAR FORNECEDORES",
  clientes: "LIMPAR CLIENTES",
};

function validateConfirmation(target: ClearTarget, confirmacao: string) {
  const expectedConfirmation = confirmationMap[target];

  if (!expectedConfirmation) {
    throw new Error("Tipo de limpeza inválido.");
  }

  if (confirmacao !== expectedConfirmation) {
    throw new Error(`Digite exatamente: ${expectedConfirmation}`);
  }
}

async function deleteAllFromTable(tableName: string) {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .not("id", "is", null);

  if (error) {
    throw new Error(`Erro ao limpar a tabela ${tableName}: ${error.message}`);
  }
}

export class AdminMaintenanceService {
  static async clearData(
    target: ClearTarget,
    confirmacao: string
  ): Promise<ClearResult> {
    validateConfirmation(target, confirmacao);

    switch (target) {
      case "produtos": {
        await deleteAllFromTable("movimentacoes");
        await deleteAllFromTable("produtos");

        return {
          message:
            "Produtos removidos com sucesso. As movimentações vinculadas também foram removidas.",
        };
      }

      case "entradas": {
        const { error } = await supabase
          .from("movimentacoes")
          .delete()
          .or(
            "natureza.ilike.%entrada%,tipo.ilike.%entrada%,tipo.ilike.%compra%,tipo.ilike.%reposicao%,tipo.ilike.%reposição%,tipo.ilike.%devolucao%,tipo.ilike.%devolução%,tipo.ilike.%ajuste positivo%"
          );

        if (error) {
          throw new Error(`Erro ao limpar entradas: ${error.message}`);
        }

        return {
          message: "Entradas removidas com sucesso.",
        };
      }

      case "saidas": {
        const { error } = await supabase
          .from("movimentacoes")
          .delete()
          .or(
            "natureza.ilike.%saida%,natureza.ilike.%saída%,tipo.ilike.%saida%,tipo.ilike.%saída%,tipo.ilike.%venda%,tipo.ilike.%uso%,tipo.ilike.%perda%,tipo.ilike.%avaria%,tipo.ilike.%ajuste negativo%"
          );

        if (error) {
          throw new Error(`Erro ao limpar saídas: ${error.message}`);
        }

        return {
          message: "Saídas removidas com sucesso.",
        };
      }

      case "movimentacoes": {
        await deleteAllFromTable("movimentacoes");

        return {
          message: "Movimentações removidas com sucesso.",
        };
      }

      case "fornecedores": {
        await deleteAllFromTable("fornecedores");

        return {
          message: "Fornecedores removidos com sucesso.",
        };
      }

      case "clientes": {
        await deleteAllFromTable("clientes");

        return {
          message: "Clientes removidos com sucesso.",
        };
      }

      default: {
        throw new Error("Tipo de limpeza inválido.");
      }
    }
  }
}