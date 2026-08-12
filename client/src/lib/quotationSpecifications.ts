export type QuotationSpecificationEntry = { key: string; value: string };

function parseRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function getSelectedQuotationSpecifications(raw: string | null | undefined): QuotationSpecificationEntry[] {
  const root = parseRecord(raw);
  const candidates = [root, root.selectedAttributes, root.variationSnapshot, root.attributes, root.variations]
    .map(parseRecord);
  const seen = new Set<string>();
  const entries: QuotationSpecificationEntry[] = [];

  for (const candidate of candidates) {
    for (const [key, value] of Object.entries(candidate)) {
      if (["selectedAttributes", "variationSnapshot", "attributes", "variations"].includes(key)) continue;
      if (value === null || value === undefined || typeof value === "object") continue;
      const normalized = String(value).trim();
      if (!normalized || seen.has(key)) continue;
      seen.add(key);
      entries.push({ key, value: normalized });
    }
  }

  return entries;
}
