import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminKanban.tsx"), "utf8");

describe("Kanban de produção administrativo", () => {
  it("exibe o estado de arte dentro do card operacional", () => {
    expect(source).toContain('{artState !== "none" && <ArtStateTag state={artState} />}');
    expect(source).toContain("Cliente aprovou a arte");
    expect(source).toContain("aria-busy={isUpdating}");
  });

  it("rotula busca, filtros de coluna e painel de detalhes", () => {
    expect(source).toContain('aria-label="Buscar por número do pedido"');
    expect(source).toContain('aria-label="Colunas visíveis do Kanban"');
    expect(source).toContain('aria-pressed={!hiddenCols.has(col.id)}');
    expect(source).toContain('aria-label="Detalhes do pedido selecionado"');
  });

  it("mantém os principais controles operacionais na identidade rosa", () => {
    expect(source).toContain("focus:ring-pink-300");
    expect(source).toContain("bg-pink-50 text-pink-700 border-pink-200");
    expect(source).toContain("text-pink-600 hover:text-pink-700 underline");
  });
});
