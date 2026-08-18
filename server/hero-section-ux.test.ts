import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("banner principal e busca de produtos", () => {
  it("rotula a busca e anuncia seus estados para tecnologias assistivas", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/HeroSection.tsx"), "utf8");

    expect(source).toContain('aria-labelledby="hero-title"');
    expect(source).toContain('aria-label="Buscar produtos no catálogo"');
    expect(source).toContain('aria-autocomplete="list"');
    expect(source).toContain('role="listbox"');
    expect(source).toContain('aria-label="Resultados da busca de produtos"');
  });

  it("leva buscas com múltiplos resultados para a página de busca e mantém pilares semânticos", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/HeroSection.tsx"), "utf8");

    expect(source).toContain("/busca?q=${encodeURIComponent(normalizedQuery)}");
    expect(source).toContain('aria-label="Pilares da Maria Imprime"');
    expect(source).toContain('role="listitem"');
    expect(source).toContain('alt=""');
  });
});
