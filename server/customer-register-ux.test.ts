import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("cadastro do cliente", () => {
  it("padroniza fundos, ícones, ações e termos na identidade rosa", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/CustomerRegister.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("from-pink-50");
    expect(source).toContain("text-pink-600");
    expect(source).toContain("accent-pink-600");
    expect(source).not.toContain("bg-orange-500 hover:bg-orange-600");
  });

  it("acessibiliza os controles de senha e o retorno de consulta de CEP", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/CustomerRegister.tsx"), "utf8");

    expect(source).toContain('aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}');
    expect(source).toContain('aria-label={showConfirm ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}');
    expect(source).toContain("aria-pressed={showPassword}");
    expect(source).toContain("aria-pressed={showConfirm}");
    expect(source).toContain('aria-label="Consultando CEP"');
  });
});
