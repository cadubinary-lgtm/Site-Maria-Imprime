import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminUsuarios.tsx"), "utf8");
const routerSource = readFileSync(resolve(import.meta.dirname, "../server/routers-admin-auth.ts"), "utf8");

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

  it("oferece exclusão com confirmação apenas para superadmin e protege o operador atual", () => {
    expect(source).toContain("const deleteAdmin = trpc.adminAuth.deleteAdmin.useMutation");
    expect(source).toContain("aria-label={`Excluir operador ${admin.name}`}");
    expect(source).toContain("Excluir operador permanentemente?");
    expect(source).toContain("Esta ação não pode ser desfeita.");
    expect(source).toContain("isSuperAdmin && admin.id !== adminUser?.id");
    expect(source).toContain("event.preventDefault();");
    expect(source).toContain("deleteAdmin.mutate({ id: deleteTarget.id })");
  });

  it("valida a exclusão no servidor, invalida sessões e preserva ao menos um superadmin", () => {
    expect(routerSource).toContain("deleteAdmin: superAdminProcedure");
    expect(routerSource).toContain("Você não pode excluir sua própria conta.");
    expect(routerSource).toContain("Mantenha pelo menos um Superadmin ativo no sistema.");
    expect(routerSource).toContain("await db.delete(adminSessions).where(eq(adminSessions.adminId, input.id));");
    expect(routerSource).toContain("await db.delete(adminAccounts).where(eq(adminAccounts.id, input.id));");
    expect(routerSource).toContain('action: "delete_admin"');
  });
});
