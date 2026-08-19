/**
 * ProductTagBadges — tags flutuantes sobre a imagem do produto.
 * Fundo preto, texto branco, estilo pílula com ícone.
 * Posicionamento absoluto configurável via prop tagPosition.
 */

const TAG_ICONS: Record<string, string> = {
  "Mais vendido": "🔥",
  "Promoção": "🏷️",
  "Destaque": "⭐",
  "Novo": "✨",
};

type TagPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center";

const POSITION_CLASSES: Record<TagPosition, string> = {
  "top-left":      "top-2 left-2 items-start",
  "top-right":     "top-2 right-2 items-end",
  "bottom-left":   "bottom-2 left-2 items-start",
  "bottom-right":  "bottom-2 right-2 items-end",
  "top-center":    "top-2 left-1/2 -translate-x-1/2 items-center",
  "bottom-center": "bottom-2 left-1/2 -translate-x-1/2 items-center",
};

interface ProductTagBadgesProps {
  tags?: string | null;        // JSON string array ou null
  tagPosition?: string | null; // TagPosition ou null → padrão "top-right"
}

export function ProductTagBadges({ tags, tagPosition }: ProductTagBadgesProps) {
  if (!tags) return null;

  let parsed: string[] = [];
  try {
    parsed = JSON.parse(tags);
  } catch {
    return null;
  }

  if (!parsed || parsed.length === 0) return null;

  const pos = (tagPosition as TagPosition) || "top-right";
  const posClass = POSITION_CLASSES[pos] ?? POSITION_CLASSES["top-right"];

  return (
    <div className={`absolute z-10 flex w-1/2 flex-col gap-1 ${posClass}`}>

      {parsed.map((tag) => (
        <span
          key={tag}
          className="product-tag-badge flex h-4 w-full items-center justify-center gap-0.5 rounded-full bg-black px-1 py-0 text-[9px] font-semibold text-white shadow-sm whitespace-nowrap"
        >
          <span>{TAG_ICONS[tag] ?? "🏷️"}</span>
          <span>{tag}</span>
        </span>
      ))}
    </div>
  );
}

/** Lista de opções para uso em selects do painel admin */
export const TAG_POSITION_OPTIONS: { value: TagPosition; label: string }[] = [
  { value: "top-left",      label: "Canto Superior Esquerdo" },
  { value: "top-right",     label: "Canto Superior Direito (padrão)" },
  { value: "bottom-left",   label: "Canto Inferior Esquerdo" },
  { value: "bottom-right",  label: "Canto Inferior Direito" },
  { value: "top-center",    label: "Centro Superior" },
  { value: "bottom-center", label: "Centro Inferior" },
];
