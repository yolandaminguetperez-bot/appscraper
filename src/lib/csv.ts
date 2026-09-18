/** Shared CSV writing for the export endpoints. */

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  // Arrays (countries, topics) would stringify with commas and split the row.
  const text = Array.isArray(value) ? value.join(" ") : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvBody<T extends Record<string, unknown>>(
  columns: readonly string[],
  rows: T[],
): string {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n");
}

export function csvHeaders(name: string): HeadersInit {
  return {
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
  };
}

/** Query-string params in the shape the filter parsers expect. */
export function rawParamsFrom(url: URL): Record<string, string[]> {
  const params: Record<string, string[]> = {};
  for (const key of new Set(url.searchParams.keys())) params[key] = url.searchParams.getAll(key);
  return params;
}

/**
 * Walks every page of a filtered result set. Exports ignore pagination — the
 * point is to take the whole selection — but not without a ceiling.
 */
export function collectPages<T>(
  fetchPage: (page: number) => { rows: T[]; pages: number },
  limit = 10_000,
): T[] {
  const all: T[] = [];
  for (let page = 1; ; page += 1) {
    const { rows, pages } = fetchPage(page);
    all.push(...rows);
    if (page >= pages || all.length >= limit) return all.slice(0, limit);
  }
}
