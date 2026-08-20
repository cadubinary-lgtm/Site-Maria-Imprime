import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminLayout.tsx"), "utf8");
const orderDetailSource = readFileSync(resolve(process.cwd(), "client/src/pages/admin/AdminOrderDetail.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

describe("badges da linha de produção", () => {
  it("mostra contagens específicas nos subitens de Pré-Impressão", () => {
    expect(source).toContain("trpc.admin.getPrepressMenuIndicators.useQuery");
    expect(source).toContain('label: "Liberado para Análise", href: "/admin/pre-impressao?status=liberado_analise", badge: prepressIndicators?.liberadoParaAnalise || undefined');
    expect(source).toContain('label: "Arte Final Aprovada", href: "/admin/pre-impressao?status=arte_final_aprovada", badge: prepressIndicators?.arteFinalAprovada || undefined');
    expect(source).not.toContain('label: "Pré-Impressão",\n            badge:');
    expect(source).toContain('label: "Status de Produção",\n            badge: menuIndicators.inProduction || undefined');
    expect(source).toContain('{ ...ADMIN_DASHBOARD_LINKS.production, icon: <LayoutDashboard className="w-4 h-4" /> },');
  });

  it("exclui itens e pedidos em produção das contagens de Pré-Impressão", () => {
    expect(routerSource).toContain("getPrepressMenuIndicators: adminAnyProcedure.query");
    expect(routerSource).toContain(".innerJoin(orders, eq(orderItems.orderId, orders.id))");
    expect(routerSource).toContain('"em_producao"');
    expect(routerSource).toContain('item.preProductionStatus !== "em_producao"');
    expect(routerSource).toContain('item.preProductionStatus === "liberado_analise"');
    expect(routerSource).toContain('item.preProductionStatus === "arte_final_aprovada"');
  });

  it("atualiza os indicadores ao alterar a pré-impressão, iniciar produção ou mudar o pedido", () => {
    expect(orderDetailSource.match(/utils\.admin\.getAllOrders\.invalidate\(\);/g)?.length).toBeGreaterThanOrEqual(2);
    expect(orderDetailSource.match(/utils\.admin\.getPrepressMenuIndicators\.invalidate\(\);/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
