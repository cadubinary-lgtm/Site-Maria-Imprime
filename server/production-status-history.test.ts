import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const database = read("server/db.ts");
const router = read("server/routers.ts");
const schema = read("drizzle/schema.ts");
const kanban = read("client/src/pages/admin/AdminKanban.tsx");
const orderDetail = read("client/src/pages/admin/AdminOrderDetail.tsx");
const productionScreen = read("client/src/pages/admin/AdminStatusProducao.tsx");

describe("tags e histórico de status de produção", () => {
  it("cria um histórico por pedido independente da ficha técnica legada", () => {
    expect(schema).toContain('orderProductionStatusHistory = mysqlTable("orderProductionStatusHistory"');
    expect(database).toContain("recordProductionStatusHistory");
    expect(router).toContain("getProductionStatusHistory:");
  });

  it("insere Pendente ao entrar em produção e encerra a tag nos estados finais", () => {
    expect(database).toContain('status === "em_producao" && previousStatus !== "em_producao"');
    expect(database).toContain('"pendente"');
    expect(database).toContain('"pronto_entrega"');
    expect(database).toContain('"pronto_retirada"');
    expect(database).toContain('"entregue"');
    expect(database).toContain('"cancelado"');
    expect(database).toContain('productionStatus: null');
  });

  it("registra as mudanças manuais de Impresso e Acabamento Finalizado", () => {
    const mutation = router.slice(router.indexOf("updateProductionStatus:"), router.indexOf("getProductionStatusHistory:"));
    expect(mutation).toContain("previousProductionStatus");
    expect(mutation).toContain("recordProductionStatusHistory");
    expect(mutation).toContain('"encerrado"');
  });

  it("mostra a tag no Kanban e no acompanhamento enquanto o pedido está em produção", () => {
    expect(kanban).toContain('order.status === "em_producao"');
    expect(kanban).toContain("PRODUCTION_TAGS");
    expect(kanban).toContain('order.productionStatus === "pending" ? "pendente"');
    expect(orderDetail).toContain('o.status === "em_producao"');
    expect(orderDetail).toContain('o.productionStatus === "pending" ? "pendente"');
    expect(orderDetail).toContain("Histórico de Status de Produção");
  });

  it("restringe a lixeira a Admin e Super Admin e exige confirmação", () => {
    expect(router).toContain("deleteProductionStatusHistory:");
    expect(router).toContain('["admin", "superadmin"].includes(adminUser.role)');
    expect(productionScreen).toContain('adminUser?.role === "admin" || adminUser?.role === "superadmin"');
    expect(productionScreen).toContain("Excluir este registro do Histórico de Status de Produção?");
  });
});
