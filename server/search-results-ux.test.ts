import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("resultados da busca pública", () => {
  it("usa a identidade rosa nos estados, preços e chamadas principais", () => {
    const source = readFileSync(resolve(root, "client/src/pages/public/SearchResults.tsx"), "utf8");

    expect(source).toContain('text-pink-600');
    expect(source).toContain('bg-pink-600');
    expect(source).not.toContain('bg-orange-500 hover:bg-orange-600');
    expect(source).not.toContain('text-orange-500');
  });

  it("oferece ações claras quando a busca não retorna resultados", () => {
    const source = readFileSync(resolve(root, "client/src/pages/public/SearchResults.tsx"), "utf8");

    expect(source).toContain('href="/catalogo"');
    expect(source).toContain("Explorar catálogo");
    expect(source).toContain("Fazer nova busca");
    expect(source).toContain("SearchX");
  });

  it("navega para os segmentos sem cartões clicáveis dependentes de evento de mouse", () => {
    const source = readFileSync(resolve(root, "client/src/pages/public/SearchResults.tsx"), "utf8");

    expect(source).toContain('href={`/catalogo?segmentId=${category.id}`}');
    expect(source).not.toContain('navigate(`/categoria/${category.id}`)');
    expect(source).toContain("aria-live=\"polite\"");
  });
});
