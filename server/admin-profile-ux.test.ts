import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminProfile.tsx"), "utf8");

describe("perfil administrativo", () => {
  it("usa rosa nos controles não semânticos do perfil", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain("text-pink-600");
    expect(source).toContain("bg-pink-100 text-pink-700 border-pink-200");
  });

  it("associa os campos de perfil e senha a seus rótulos", () => {
    expect(source).toContain('htmlFor="profile-name"');
    expect(source).toContain('id="profile-email"');
    expect(source).toContain('htmlFor="current-password"');
    expect(source).toContain('id="confirm-password"');
  });

  it("nomeia a visualização de senha e comunica processamento", () => {
    expect(source).toContain('aria-label={showCurrent ? "Ocultar senha atual" : "Mostrar senha atual"}');
    expect(source).toContain('aria-label="Carregando perfil administrativo"');
    expect(source).toContain("aria-busy={changePasswordMutation.isPending}");
  });
});
