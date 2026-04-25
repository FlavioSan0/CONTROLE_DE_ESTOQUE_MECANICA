type CsvPrimitive = string | number | boolean | null | undefined;

type ExportCsvOptions<T extends Record<string, CsvPrimitive>> = {
  filename: string;
  rows: T[];
  emptyMessage?: string;
};

function formatCsvValue(value: CsvPrimitive) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/\r?\n|\r/g, " ")
    .replace(/"/g, '""');
}

export function exportCsv<T extends Record<string, CsvPrimitive>>({
  filename,
  rows,
  emptyMessage = "Não há dados disponíveis para exportar.",
}: ExportCsvOptions<T>) {
  if (!rows.length) {
    throw new Error(emptyMessage);
  }

  const headers = Object.keys(rows[0]);

  const csvLines = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((header) => `"${formatCsvValue(row[header])}"`)
        .join(";")
    ),
  ];

  const csvContent = "\uFEFF" + csvLines.join("\n");
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function todayFileDate() {
  return new Date().toISOString().slice(0, 10);
}

export function formatCurrencyForCsv(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0);

  if (!Number.isFinite(numberValue)) {
    return "0,00";
  }

  return numberValue.toFixed(2).replace(".", ",");
}

export function formatDateTimeForCsv(value: string | Date | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("pt-BR");
}