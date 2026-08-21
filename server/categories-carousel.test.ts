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
    expect(source).toContain("w-[9.5rem]");
    expect(source).toContain("rounded-2xl");
    expect(source).toContain("mx-10 min-w-0 flex-1 sm:mx-12");
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
    expect(source).toContain("flex h-8 w-8");
    expect(source).not.toContain("hidden h-10 w-10");
  });

  it("centraliza somente no mobile o card selecionado pelas setas", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/CategoriesCarousel.tsx"), "utf8");

    expect(source).toContain('window.matchMedia("(max-width: 639px)").matches');
    expect(source).toContain("const viewportCenter = container.scrollLeft + container.clientWidth / 2");
    expect(source).toContain("targetCard.offsetLeft - (container.clientWidth - targetCard.offsetWidth) / 2");
    expect(source).toContain('container.scrollTo({ left: targetLeft, behavior: "smooth" })');
    expect(source).toContain("snap-center");
    expect(source).toContain("sm:snap-start");
    expect(source).toContain("sm:px-1");
  });
});
