import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Carrossel de acesso rápido", () => {
  it("remove medidas fixas e mantém uma faixa horizontal responsiva", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/CategoriesCarousel.tsx"), "utf8");

    expect(source).not.toContain("width: '1189px'");
    expect(source).not.toContain("marginLeft: '50px'");
    expect(source).toContain("overflow-x-auto scroll-smooth");
    expect(source).toContain("snap-x snap-mandatory");
    expect(source).toContain('!rounded-[18px]');
    expect(source).toContain('h-[52px]');
    expect(source).not.toContain("sm:px-12");
  });

  it("oferece navegação por setas acessível e com limites de rolagem", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/CategoriesCarousel.tsx"), "utf8");

    expect(source).toContain('aria-label="Ver categorias anteriores"');
    expect(source).toContain('aria-label="Ver próximas categorias"');
    expect(source).toContain("disabled={!canScrollLeft}");
    expect(source).toContain("disabled={!canScrollRight}");
    expect(source).toContain("container.scrollBy");
    expect(source).toContain("absolute left-0 z-10");
    expect(source).toContain("absolute right-0 z-10");
    expect(source).toContain("disabled:opacity-100");
  });
});
