import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ConfiguracoesFiscais.tsx"), "utf8");

describe("configurações fiscais", () => {
  it("usa a identidade rosa nos controles de configuração", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain("border-pink-600 bg-pink-50");
    expect(source).not.toContain("bg-orange-500");
  });

  it("associa campos essenciais a seus rótulos", () => {
    expect(source).toContain('htmlFor="fiscal-cnpj"');
    expect(source).toContain('id="fiscal-cnpj"');
    expect(source).toContain('htmlFor="fiscal-address"');
    expect(source).toContain('id="fiscal-address"');
  });

  it("mantém as opções de emissão acessíveis por teclado", () => {
    expect(source).toContain('type="button"');
    expect(source).toContain("aria-pressed={emitMode === m.key}");
    expect(source).toContain("aria-busy={saveSettings.isPending}");
  });
});
