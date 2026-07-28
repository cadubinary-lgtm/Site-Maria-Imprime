/**
 * ProductTagBadges — tags flutuantes sobre a imagem do produto.
 * Fundo preto, texto branco, estilo pílula com ícone.
 * Posicionamento absoluto no canto superior esquerdo.
 */

const TAG_ICONS: Record<string, string> = {
  "Mais vendido": "🔥",
  "Promoção": "🏷️",
  "Destaque": "⭐",
  "Novo": "✨",
};

interface ProductTagBadgesProps {
  tags?: string | null; // JSON string array ou null
}

export function ProductTagBadges({ tags }: ProductTagBadgesProps) {
  if (!tags) return null;

  let parsed: string[] = [];
  try {
    parsed = JSON.parse(tags);
  } catch {
    return null;
  }

  if (!parsed || parsed.length === 0) return null;

  return (
    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
      {parsed.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-black text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm"
        >
          <span>{TAG_ICONS[tag] ?? "🏷️"}</span>
          <span>{tag}</span>
        </span>
      ))}
    </div>
  );
}
