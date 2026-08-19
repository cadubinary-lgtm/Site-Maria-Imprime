import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminOSPrint.tsx"), "utf8");

describe("impressão de ordem de serviço", () => {
  it("padroniza retorno e impressão na identidade rosa", () => {
    expect(source).toContain('className="text-pink-700 hover:bg-pink-50 hover:text-pink-800"');
    expect(source).toContain('className="border-pink-200 text-pink-700 hover:bg-pink-50"');
    expect(source).toContain('className="bg-pink-600 hover:bg-pink-700"');
  });

  it("expõe carregamento, retorno e formatos de impressão de forma acessível", () => {
    expect(source).toContain('aria-label="Carregando ordem de serviço"');
    expect(source).toContain('aria-pressed={printMode === m}');
    expect(source).toContain('aria-label={`Formato de impressão ${m === "a4" ? "A4" : "térmica 80 milímetros"}`}');
    expect(source).toContain('type="button"');
  });

  it("mantém a impressão baseada na quantidade real de itens", () => {
    expect(source).toContain('items.map((item: any, i: number) => {');
    expect(source).not.toContain('Item 1 de 2');
  });
});
