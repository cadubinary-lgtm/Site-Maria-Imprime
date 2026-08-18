import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminLogin.tsx"), "utf8");

describe("acesso administrativo", () => {
  it("usa rosa na identidade visual e no CTA de acesso", () => {
    expect(source).toContain("bg-pink-600 rounded-2xl");
    expect(source).toContain("bg-pink-500/10");
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
  });

  it("preserva campos de credenciais identificados e foco rosa", () => {
    expect(source).toContain('htmlFor="email"');
    expect(source).toContain('htmlFor="password"');
    expect(source).toContain("focus:border-pink-500 focus:ring-pink-500/20");
  });

  it("permite operar a visualização de senha por teclado e anuncia processamento", () => {
    expect(source).toContain('aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}');
    expect(source).not.toContain("tabIndex={-1}");
    expect(source).toContain("aria-busy={isLoggingIn}");
  });
});
