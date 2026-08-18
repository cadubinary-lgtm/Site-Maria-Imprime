import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminUsuarios.tsx"), "utf8");

describe("gestão de usuários administrativos", () => {
  it("usa rosa para o perfil e acesso total de superadmin", () => {
    expect(source).toContain("bg-pink-100 text-pink-700 border-pink-200");
    expect(source).toContain("text-pink-600 font-medium");
    expect(source).not.toContain("bg-orange-100 text-orange-700");
  });

  it("associa campos de criação, edição e senha aos seus rótulos", () => {
    expect(source).toContain('htmlFor="create-admin-name"');
    expect(source).toContain('id="create-admin-name"');
    expect(source).toContain('htmlFor="edit-admin-email"');
    expect(source).toContain('id="reset-admin-password"');
  });

  it("expõe o estado do acordeão de permissões", () => {
    expect(source).toContain("aria-expanded={isOpen}");
    expect(source).toContain("aria-controls={`permissions-${group.key}`}");
    expect(source).toContain("aria-busy={createAdmin.isPending}");
  });
});
