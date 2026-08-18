import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("login do cliente", () => {
  it("aplica a identidade rosa às ações e navegação de acesso", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/CustomerLogin.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("from-pink-50");
    expect(source).toContain("text-pink-600");
    expect(source).not.toContain("bg-orange-500 hover:bg-orange-600");
  });

  it("mantém o aviso de e-mail não confirmado como alerta semântico e acessibiliza a senha", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/CustomerLogin.tsx"), "utf8");

    expect(source).toContain("border-yellow-200 bg-yellow-50");
    expect(source).toContain('aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}');
    expect(source).toContain("aria-pressed={showPassword}");
    expect(source).toContain('htmlFor="email"');
    expect(source).toContain('htmlFor="password"');
  });
});
