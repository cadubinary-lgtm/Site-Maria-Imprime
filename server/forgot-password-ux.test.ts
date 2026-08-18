import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("recuperação de senha do cliente", () => {
  it("adota a identidade rosa e mantém os retornos semânticos de sucesso", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/ForgotPassword.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("from-pink-50");
    expect(source).toContain("text-pink-600");
    expect(source).toContain("bg-green-100");
    expect(source).not.toContain("bg-orange-500 hover:bg-orange-600");
  });

  it("mascara a referência de CPF ou CNPJ e anuncia a confirmação de envio", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/ForgotPassword.tsx"), "utf8");

    expect(source).toContain("function maskCpfCnpj");
    expect(source).toContain("maskCpfCnpj(cpfReference)");
    expect(source).not.toContain("<strong>{cpfReference}</strong>");
    expect(source).toContain('aria-live="polite"');
  });
});
