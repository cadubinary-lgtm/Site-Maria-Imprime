import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminsManager.tsx"), "utf8");

describe("gerenciador alternativo de administradores", () => {
  it("usa a identidade rosa para perfis de liderança, carregamento e ações principais", () => {
    expect(source).toContain("bg-pink-500/20 text-pink-300 border-pink-500/30");
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain('aria-label="Carregando administradores"');
  });

  it("associa todos os campos sensíveis a rótulos identificáveis", () => {
    expect(source).toContain('htmlFor="create-admin-password"');
    expect(source).toContain('id="edit-admin-role"');
    expect(source).toContain('id="reset-admin-password-confirmation"');
    expect(source).toContain("minLength={8}");
  });

  it("nomeia as ações por administrador e comunica processamento", () => {
    expect(source).toContain('aria-label={`Editar ${admin.name}`}');
    expect(source).toContain('aria-label={`Redefinir senha de ${admin.name}`}');
    expect(source).toContain("aria-busy={toggleStatusMutation.isPending}");
  });
});
