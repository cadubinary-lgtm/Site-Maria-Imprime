import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/NotasFiscais.tsx"), "utf8");

describe("identidade visual das notas fiscais", () => {
  it("usa rosa nos controles comerciais e de navegação", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain("bg-pink-600 text-white border-pink-600");
    expect(source).toContain("text-pink-600 hover:text-pink-700 hover:underline");
  });

  it("preserva o laranja apenas como alerta semântico de nota pendente", () => {
    expect(source).toContain('pending: { label: "Pendente", color: "bg-orange-100 text-orange-700" }');
    expect(source).not.toContain("bg-orange-500");
    expect(source).not.toContain("hover:bg-orange-600");
  });

  it("identifica o carregamento de notas fiscais", () => {
    expect(source).toContain('aria-label="Carregando notas fiscais"');
  });
});
