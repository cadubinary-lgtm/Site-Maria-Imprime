import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminAuthHook = readFileSync(resolve(process.cwd(), "client/src/hooks/useAdminAuth.ts"), "utf8");
const adminLayout = readFileSync(resolve(process.cwd(), "client/src/components/AdminLayout.tsx"), "utf8");
const adminAuthRouter = readFileSync(resolve(process.cwd(), "server/routers-admin-auth.ts"), "utf8");

describe("paridade de sessão administrativa no preview", () => {
  it("usa a identidade Manus autenticada como fallback administrativo somente no ambiente interno", () => {
    expect(adminAuthHook).toContain('useAdminAuth as useManusAdminAuth');
    expect(adminAuthHook).toContain('window.location.hostname.includes("manus.")');
    expect(adminAuthHook).toContain('const manusRole = String(manusUser?.role ?? "");');
    expect(adminAuthHook).toContain('const isManusAdministrator = manusRole === "admin" || manusRole === "superadmin";');
    expect(adminAuthHook).toContain("const effectiveAdminUser = adminUser ?? manusAdminUser;");
    expect(adminAuthHook).toContain("adminUser: effectiveAdminUser");
  });

  it("mantém o layout administrativo vinculado ao hook unificado", () => {
    expect(adminLayout).toContain("const { adminUser: user, logout } = useAdminAuth();");
  });

  it("resolve o proprietário autenticado no preview com o mesmo perfil administrativo do oficial", () => {
    expect(adminAuthRouter).toContain("function resolveManusAdminUser(ctx: any)");
    expect(adminAuthRouter).toContain("manusUser.openId === ENV.ownerOpenId");
    expect(adminAuthRouter).toContain('role: isProjectOwner ? "superadmin" : manusUser.role');
    expect(adminAuthRouter).toContain("const manusAdminUser = resolveManusAdminUser(ctx);");
  });
});
