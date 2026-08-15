export function extractQuotationKpiRow(result: unknown): Record<string, unknown> {
  if (!Array.isArray(result)) return {};

  const rows = result[0];
  if (Array.isArray(rows)) return (rows[0] as Record<string, unknown> | undefined) ?? {};
  return (rows as Record<string, unknown> | undefined) ?? {};
}
