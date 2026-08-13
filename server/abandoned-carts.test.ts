import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dbPath = resolve(process.cwd(), "server/db.ts");
const routerPath = resolve(process.cwd(), "server/abandonedCartsRouter.ts");
const schedulePath = resolve(process.cwd(), "server/abandonedCartsSchedule.ts");
const adminPagePath = resolve(process.cwd(), "client/src/pages/admin/AdminAbandonedCarts.tsx");
const ordersPagePath = resolve(process.cwd(), "client/src/pages/admin/AdminOrders.tsx");
const menuPath = resolve(process.cwd(), "client/src/components/AdminLayout.tsx");

describe("módulo de carrinhos abandonados", () => {
  it("agrupa carrinhos pela última atividade e preserva a regra de 48 horas", () => {
    const source = readFileSync(dbPath, "utf8");

    expect(source).toContain("export async function getAbandonedCartSummaries");
    expect(source).toContain("DATE_ADD(MAX(ci.updatedAt), INTERVAL 48 HOUR)");
    expect(source).toContain("HAVING MAX(updatedAt) < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 48 HOUR)");
    expect(source).toContain("DELETE ci");
  });

  it("restringe a limpeza automática a chamadas autenticadas de tarefas agendadas", () => {
    const source = readFileSync(schedulePath, "utf8");

    expect(source).toContain("if (!user.isCron || !user.taskUid)");
    expect(source).toContain("cleanupExpiredAbandonedCarts()");
  });

  it("mantém consulta e limpeza manual protegidas por autenticação administrativa", () => {
    const source = readFileSync(routerPath, "utf8");

    expect(source).toContain("list: adminProcedure.query");
    expect(source).toContain("cleanupExpired: adminProcedure.mutation");
  });

  it("expõe a página no menu de Vendas e mostra a política de retenção", () => {
    const pageSource = readFileSync(adminPagePath, "utf8");
    const ordersSource = readFileSync(ordersPagePath, "utf8");
    const menuSource = readFileSync(menuPath, "utf8");

    expect(pageSource).toContain("48 horas após a última atividade");
    expect(pageSource).toContain("Limpar expirados");
    expect(ordersSource).toContain('get("view") === "carrinho-abandonado"');
    expect(menuSource).toContain('href: "/admin/pedidos?view=carrinho-abandonado"');
  });
});
