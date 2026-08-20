import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminLayout.tsx"), "utf8");
const orderDetailSource = readFileSync(resolve(process.cwd(), "client/src/pages/admin/AdminOrderDetail.tsx"), "utf8");

describe("badges da linha de produção", () => {
  it("mostra análise pendente em Pré-Impressão e produção ativa em Status de Produção", () => {
    expect(source).toContain('label: "Pré-Impressão",\n            badge: awaitingAnalysisCount || undefined');
    expect(source).toContain('label: "Status de Produção",\n            badge: menuIndicators.inProduction || undefined');
    expect(source).toContain('{ ...ADMIN_DASHBOARD_LINKS.production, icon: <LayoutDashboard className="w-4 h-4" /> },');
  });

  it("invalida a consulta do painel ao atualizar ou enviar o pedido para produção", () => {
    expect(orderDetailSource.match(/utils\.admin\.getAllOrders\.invalidate\(\);/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
