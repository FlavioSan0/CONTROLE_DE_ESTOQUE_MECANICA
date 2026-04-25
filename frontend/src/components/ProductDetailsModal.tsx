"use client";

import React from "react";
import {
  X,
  Pencil,
  Ban,
  Package,
  Boxes,
  AlertTriangle,
  Wallet,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import type { ProdutoDetalhes } from "../types/product-details";

type ProductDetailsModalProps = {
  open: boolean;
  loading?: boolean;
  data?: ProdutoDetalhes | null;
  onClose: () => void;
  onEdit?: () => void;
  onInactivate?: () => void;
  inactivating?: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function formatCurrency(value?: number | null) {
  if (value == null) return "-";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function getMovementAppearance(natureza?: string | null, tipo?: string | null) {
  const naturezaNormalizada = String(natureza ?? "").toLowerCase();
  const tipoNormalizado = String(tipo ?? "").toLowerCase();

  const isEntrada =
    naturezaNormalizada.includes("entrada") ||
    tipoNormalizado.includes("entrada") ||
    tipoNormalizado.includes("compra") ||
    tipoNormalizado.includes("reposição") ||
    tipoNormalizado.includes("reposicao") ||
    tipoNormalizado.includes("devolução") ||
    tipoNormalizado.includes("devolucao") ||
    tipoNormalizado.includes("ajuste positivo");

  if (isEntrada) {
    return {
      label: "Entrada",
      icon: ArrowDownCircle,
      badgeClass:
        "border border-emerald-200 bg-emerald-50 text-emerald-700",
      lineClass:
        "border-l-4 border-l-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/70",
      quantityClass: "text-emerald-700",
      signal: "+",
    };
  }

  return {
    label: "Saída",
    icon: ArrowUpCircle,
    badgeClass:
      "border border-amber-200 bg-amber-50 text-amber-700",
    lineClass:
      "border-l-4 border-l-amber-400 bg-amber-50/40 hover:bg-amber-50/70",
    quantityClass: "text-amber-700",
    signal: "-",
  };
}

function InfoHighlightCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "default" | "success" | "warning";
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50/70"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50/70"
      : "border-zinc-200 bg-white";

  const iconClasses =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
      : tone === "warning"
      ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
      : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {label}
          </p>
          <p className="mt-3 text-2xl font-bold text-zinc-950">{value}</p>
        </div>

        <div className={`rounded-2xl p-3 ${iconClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-zinc-900">{value || "-"}</p>
    </div>
  );
}

export default function ProductDetailsModal({
  open,
  loading = false,
  data,
  onClose,
  onEdit,
  onInactivate,
  inactivating = false,
}: ProductDetailsModalProps) {
  if (!open) return null;

  const produto = data?.produto;
  const movimentacoes = data?.movimentacoes ?? [];

  const estoqueBaixo =
    produto != null &&
    Number(produto.estoque_minimo ?? 0) > 0 &&
    Number(produto.estoque_atual ?? 0) <= Number(produto.estoque_minimo ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-7xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-white to-zinc-50 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-zinc-950 p-3 text-white shadow-sm">
                  <Package className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold text-zinc-950 sm:text-3xl">
                    Detalhes do produto
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Informações completas e histórico de movimentações
                  </p>
                </div>
              </div>

              {produto ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    Código: {produto.codigo || "-"}
                  </span>

                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {produto.nome || "-"}
                  </span>

                  {estoqueBaixo ? (
                    <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      Estoque em alerta
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Estoque normal
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {produto?.id && onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
              ) : null}

              {produto?.id && onInactivate ? (
                <button
                  type="button"
                  onClick={onInactivate}
                  disabled={inactivating}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Ban className="h-4 w-4" />
                  {inactivating ? "Inativando..." : "Inativar"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
                Fechar
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto bg-[#fcfcfd] px-6 py-6">
          {loading ? (
            <div className="py-20 text-center text-sm text-zinc-500">
              Carregando detalhes do produto...
            </div>
          ) : !produto ? (
            <div className="py-20 text-center text-sm text-zinc-500">
              Não foi possível carregar os dados do produto.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <InfoHighlightCard
                      label="Estoque atual"
                      value={produto.estoque_atual}
                      icon={Boxes}
                      tone="default"
                    />
                    <InfoHighlightCard
                      label="Estoque mínimo"
                      value={produto.estoque_minimo ?? "-"}
                      icon={AlertTriangle}
                      tone={estoqueBaixo ? "warning" : "default"}
                    />
                    <InfoHighlightCard
                      label="Custo unitário"
                      value={formatCurrency(produto.custo_unitario)}
                      icon={Wallet}
                      tone="warning"
                    />
                  </div>

                  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-zinc-700" />
                      <h3 className="text-lg font-bold text-zinc-950">
                        Informações gerais
                      </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <InfoItem label="Código" value={produto.codigo || "-"} />
                      <InfoItem label="Nome" value={produto.nome || "-"} />
                      <InfoItem label="Categoria" value={produto.categoria || "-"} />
                      <InfoItem label="Marca" value={produto.marca || "-"} />
                      <InfoItem
                        label="Unidade de medida"
                        value={produto.unidade_medida || "-"}
                      />
                      <InfoItem label="Fornecedor" value={produto.fornecedor || "-"} />
                      <InfoItem
                        label="Preço de venda"
                        value={formatCurrency(produto.preco_venda)}
                      />
                      <InfoItem
                        label="Criado em"
                        value={formatDateTime(produto.created_at)}
                      />
                      <InfoItem
                        label="Atualizado em"
                        value={formatDateTime(produto.updated_at)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-zinc-950">Descrição</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">
                    {produto.descricao?.trim() || "Sem descrição cadastrada."}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-200 px-5 py-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-bold text-zinc-950">
                      Histórico de movimentações
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {movimentacoes.length} registro(s) encontrado(s)
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-zinc-50/90">
                      <tr className="text-left text-zinc-600">
                        <th className="px-4 py-3 font-semibold">Data</th>
                        <th className="px-4 py-3 font-semibold">Tipo</th>
                        <th className="px-4 py-3 font-semibold">Natureza</th>
                        <th className="px-4 py-3 font-semibold">Qtd.</th>
                        <th className="px-4 py-3 font-semibold">Usuário</th>
                        <th className="px-4 py-3 font-semibold">Observação</th>
                        <th className="px-4 py-3 font-semibold">NF</th>
                      </tr>
                    </thead>

                    <tbody>
                      {movimentacoes.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-zinc-500"
                          >
                            Nenhuma movimentação encontrada para este produto.
                          </td>
                        </tr>
                      ) : (
                        movimentacoes.map((mov) => {
                          const appearance = getMovementAppearance(
                            mov.natureza,
                            mov.tipo
                          );
                          const NatureIcon = appearance.icon;

                          return (
                            <tr
                              key={mov.id}
                              className={`border-t border-zinc-100 transition ${appearance.lineClass}`}
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                                {formatDateTime(mov.data)}
                              </td>

                              <td className="px-4 py-3 font-medium text-zinc-900">
                                {mov.tipo || "-"}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${appearance.badgeClass}`}
                                >
                                  <NatureIcon className="h-3.5 w-3.5" />
                                  {appearance.label}
                                </span>
                              </td>

                              <td
                                className={`whitespace-nowrap px-4 py-3 font-bold ${appearance.quantityClass}`}
                              >
                                {appearance.signal}
                                {Number(mov.quantidade ?? 0)}
                              </td>

                              <td className="px-4 py-3 text-zinc-700">
                                {mov.usuario || "-"}
                              </td>

                              <td className="px-4 py-3 text-zinc-700">
                                {mov.observacao || "-"}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3">
                                {mov.nota_fiscal_numero ? (
                                  mov.nota_fiscal_url ? (
                                    <a
                                      href={mov.nota_fiscal_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
                                    >
                                      {mov.nota_fiscal_numero}
                                    </a>
                                  ) : (
                                    <span className="font-medium text-zinc-800">
                                      {mov.nota_fiscal_numero}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-zinc-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}