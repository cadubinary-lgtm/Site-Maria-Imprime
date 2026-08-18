import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FluxoCaixa.tsx"), "utf8");

describe("página legada de fluxo de caixa", () => {
  it("usa rosa nos controles de lançamento, filtros e carregamento", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain('period === p ? "bg-pink-600 text-white"');
    expect(source).toContain('groupBy === g ? "bg-pink-600 text-white"');
    expect(source).toContain("border-pink-600 border-t-transparent");
  });

  it("preserva entradas e saídas com cores semânticas", () => {
    expect(source).toContain("border border-green-200 bg-green-50");
    expect(source).toContain("border border-red-200 bg-red-50");
    expect(source).toContain('entryType === "income" ? "bg-green-500 text-white border-green-500"');
    expect(source).toContain('entryType === "expense" ? "bg-red-500 text-white border-red-500"');
  });

  it("permite envio do lançamento por teclado e identifica seus campos", () => {
    expect(source).toContain('id="cash-flow-entry-form"');
    expect(source).toContain('form="cash-flow-entry-form"');
    expect(source).toContain('htmlFor="cash-flow-entry-amount"');
    expect(source).toContain("aria-pressed={entryType === \"income\"}");
    expect(source).toContain("aria-busy={addEntry.isPending}");
  });
});
