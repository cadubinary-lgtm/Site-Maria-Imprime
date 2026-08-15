/**
 * OrderItemSpecs — Componente padronizado de especificações de item de pedido.
 *
 * Usado em: CartPage, OrderDetailPage (cliente) e AdminOrderDetail (admin).
 * Rótulos curtos e limpos conforme padrão definido.
 *
 * Layout: Rótulo (cinza, caixa alta) acima do valor (preto, destaque)
 *
 * Rótulos padrão:
 *   Medidas: 1x1
 *   Impressão: Solvente
 *   Material: Adesivo Brilho Promocional
 *   Gramatura: 280g - Lona Promocional
 *   Acabamento: Bastão Vertical + Ilhós nas Laterais
 *   Arte: [Nome do arquivo ou link]
 *   Prazo: Mesmo Dia
 *   Previsão: Disponível para retirada: sáb., 25/07
 *   Entrega: Retirar na Loja – Grátis
 */

import { FileText } from "lucide-react";
import { formatProductionDeadlineSurcharge } from "@/lib/production-deadline-pricing";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface OrderItemSpecsProps {
  /** Dimensões brutas: "1x1", "0.5x2" etc. */
  customDimensions?: string | null;
  /** JSON string de variações: [{name, value}] */
  variationSnapshot?: string | null;
  /** JSON string de atributos extras: {key: value} */
  selectedAttributes?: string | null;
  /** URL ou nome do arquivo de arte */
  artFileUrl?: string | null;
  /** Observações do cliente */
  notes?: string | null;
  /** Nome do prazo (ex: "Mesmo Dia") */
  prazoName?: string | null;
  /** Label de previsão (ex: "Disponível para retirada: sáb., 25/07") */
  forecastLabel?: string | null;
  /** Label de entrega (ex: "Retirar na Loja") */
  shippingLabel?: string | null;
  /** Preço do frete (0 = Grátis) */
  shippingPrice?: number | string | null;
  /** Composição persistida da taxa de urgência escolhida. */
  urgencyRate?: number | string | null;
  urgencyMultiplier?: number | string | null;
  urgencyUnit?: string | null;
  urgencySurcharge?: number | string | null;
  quantity?: number | string | null;
  /** Modo compacto (sem bloco cinza, apenas linhas) — usado no CartPage */
  compact?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseVariations(raw?: string | null): { name: string; value: string }[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function parseAttrObj(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function parseDimensions(dims?: string | null): { largura: string; altura: string } {
  if (!dims) return { largura: "", altura: "" };
  const parts = String(dims).split(/[xX×]/);
  if (parts.length >= 2) return { largura: parts[0].trim(), altura: parts[1].trim() };
  return { largura: "", altura: "" };
}

/** Normaliza o nome do rótulo para um label curto e padronizado */
function normalizeLabel(name: string): string {
  const n = name.toLowerCase().trim();
  if (n.includes("impressão") || n.includes("impressao") || n.includes("tipo de impressão") || n.includes("tipo de impressao")) return "Impressão";
  if (n.includes("material") || n.includes("tipo de material")) return "Material";
  if (n.includes("gramatura")) return "Gramatura";
  if (n.includes("acabamento") || n.includes("tipo de acabamento")) return "Acabamento";
  if (n.includes("laminação") || n.includes("laminacao")) return "Laminação";
  if (n.includes("verniz")) return "Verniz";
  if (n.includes("cor")) return "Cor";
  if (n.includes("papel")) return "Papel";
  if (n.includes("formato")) return "Formato";
  if (n.includes("dobra")) return "Dobra";
  if (n.includes("furo")) return "Furo";
  if (n.includes("ilhós") || n.includes("ilhos")) return "Ilhós";
  if (n.includes("bastão") || n.includes("bastao")) return "Bastão";
  if (n.includes("reforço") || n.includes("reforco")) return "Reforço";
  if (n.includes("colagem") || n.includes("cola")) return "Colagem";
  if (n.includes("corte")) return "Corte";
  if (n.includes("frente") || n.includes("verso")) return name; // manter original
  return name; // fallback: nome original
}

/** Verifica se é um atributo dimensional (deve ser ignorado — já exibido em Medidas) */
function isDimensional(name: string): boolean {
  const n = name.toLowerCase();
  return ["peso", "weight", "weightkg", "largura", "altura", "dimensão", "dimensao"].some(k => n.includes(k));
}

/** Agrupa variações por label normalizado, concatenando valores com " + " */
function groupVariations(variations: { name: string; value: string }[]): { label: string; value: string }[] {
  const map = new Map<string, string[]>();
  for (const v of variations) {
    if (isDimensional(v.name)) continue;
    const label = normalizeLabel(v.name);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(v.value);
  }
  return Array.from(map.entries()).map(([label, values]) => ({ label, value: values.join(" + ") }));
}

/** Formata o nome do arquivo de arte para exibição */
function formatArtFileName(url: string): string {
  const raw = url.split('/').pop() ?? url;
  return raw.replace(/^\d+-/, '').replace(/%20/g, ' ');
}

/** Formata o preço do frete sem repetir o rótulo "Entrega" na linha de especificação. */
export function formatShipping(label: string, price?: number | string | null): string {
  const normalizedLabel = label.replace(/^entrega\s*/i, "").trim() || label;
  const p = Number(price ?? 0);
  if (p > 0) return `${normalizedLabel} — R$ ${p.toFixed(2).replace('.', ',')}`;
  return `${normalizedLabel} — Grátis`;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function OrderItemSpecs({
  customDimensions,
  variationSnapshot,
  selectedAttributes,
  artFileUrl,
  notes,
  prazoName,
  forecastLabel,
  shippingLabel,
  shippingPrice,
  urgencyRate,
  urgencyMultiplier,
  urgencyUnit,
  urgencySurcharge,
  quantity,
  compact = false,
}: OrderItemSpecsProps) {
  const { largura, altura } = parseDimensions(customDimensions);
  const variations = parseVariations(variationSnapshot);
  const attrObj = parseAttrObj(selectedAttributes);
  const urgencyBreakdown = formatProductionDeadlineSurcharge({
    rate: urgencyRate,
    multiplier: urgencyMultiplier,
    unit: urgencyUnit,
    surcharge: urgencySurcharge,
    quantity,
  });

  // Variações agrupadas (sem dimensionais)
  const grouped = groupVariations(variations);

  // Atributos extras (sem dimensionais, sem os já em variações)
  const extraAttrs = Object.entries(attrObj)
    .filter(([k]) => !isDimensional(k))
    .map(([k, v]) => ({ label: normalizeLabel(k), value: String(v) }));

  // Merge: variações + atributos extras, deduplicando por label
  const allSpecs: { label: string; value: string }[] = [];
  const seen = new Set<string>();
  for (const s of [...grouped, ...extraAttrs]) {
    if (!seen.has(s.label)) {
      seen.add(s.label);
      allSpecs.push(s);
    }
  }

  const hasContent = largura || altura || allSpecs.length > 0 || artFileUrl || notes || prazoName || forecastLabel || shippingLabel || urgencyBreakdown;
  if (!hasContent) return null;

  // ── Bloco de especificação em layout vertical (rótulo acima do valor) ──────
  const SpecBlock = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-gray-900 leading-snug">{value}</span>
    </div>
  );

  // ── Linha de especificação padrão (para modo compacto) ──────────────────────
  const SpecLine = ({ label, value }: { label: string; value: string }) => (
    <p className="text-xs text-gray-700 leading-relaxed">
      <span className="text-gray-400">{label}:</span>{" "}
      <span className="font-medium text-gray-900">{value}</span>
    </p>
  );

  if (compact) {
    // Modo compacto: apenas linhas simples, sem bloco cinza
    return (
      <div className="mt-1 space-y-0.5">
        {(largura || altura) && (
          <SpecLine label="Medidas" value={`${largura}×${altura}`} />
        )}
        {allSpecs.map((s, i) => (
          <SpecLine key={i} label={s.label} value={s.value} />
        ))}
        {artFileUrl && (
          artFileUrl.startsWith('http') && !artFileUrl.includes('manus-storage') ? (
            <p className="text-xs text-gray-700">
              <span className="text-gray-400">Arte:</span>{" "}
              <a href={artFileUrl} target="_blank" rel="noreferrer" className="underline truncate text-blue-600">{artFileUrl}</a>
            </p>
          ) : (
            <SpecLine label="Arte" value={formatArtFileName(artFileUrl)} />
          )
        )}
        {notes && <SpecLine label="Obs" value={notes} />}
        {prazoName && <SpecLine label="Prazo" value={prazoName} />}
        {urgencyBreakdown && <SpecLine label="Urgência" value={urgencyBreakdown} />}
        {forecastLabel && (
          <p className="text-xs text-gray-700 leading-relaxed">{forecastLabel}</p>
        )}
        {shippingLabel && (
          <SpecLine label="Entrega" value={formatShipping(shippingLabel, shippingPrice)} />
        )}
      </div>
    );
  }

  // Modo padrão: grid de blocos em layout vertical (rótulo acima do valor)
  return (
    <div className="space-y-3">
      {/* Dimensões */}
      {(largura || altura) && (
        <SpecBlock label="Medidas" value={`${largura} × ${altura} m${largura && altura ? ` (${(parseFloat(largura) * parseFloat(altura)).toFixed(2)} m²)` : ''}`} />
      )}

      {/* Especificações agrupadas */}
      {allSpecs.map((s, i) => (
        <SpecBlock key={i} label={s.label} value={s.value} />
      ))}

      {/* Arte */}
      {artFileUrl && (
        artFileUrl.startsWith('http') && !artFileUrl.includes('manus-storage') ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Arte</span>
            <a href={artFileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 underline break-all hover:text-blue-700">{artFileUrl}</a>
          </div>
        ) : (
          <SpecBlock label="Arte" value={formatArtFileName(artFileUrl)} />
        )
      )}

      {/* Observação */}
      {notes && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3" /> Obs.
          </span>
          <span className="text-sm font-medium text-gray-900 italic leading-snug">{notes}</span>
        </div>
      )}

      {/* Prazo */}
      {prazoName && <SpecBlock label="Prazo" value={prazoName} />}

      {urgencyBreakdown && <SpecBlock label="Urgência" value={urgencyBreakdown} />}

      {/* Previsão */}
      {forecastLabel && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Previsão</span>
          <span className="text-sm font-medium text-gray-900 leading-snug">{forecastLabel}</span>
        </div>
      )}

      {/* Entrega */}
      {shippingLabel && (
        <SpecBlock label="Entrega" value={formatShipping(shippingLabel, shippingPrice)} />
      )}
    </div>
  );
}

export default OrderItemSpecs;
