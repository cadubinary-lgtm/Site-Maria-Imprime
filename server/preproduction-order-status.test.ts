import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("transição de status da pré-impressão", () => {
  const router = readFileSync("server/routers.ts", "utf8");
  const detail = readFileSync("client/src/pages/admin/AdminOrderDetail.tsx", "utf8");
  const updatePreProduction = router.slice(
    router.indexOf("updatePreProductionStatus:"),
    router.indexOf("triggerProductionStart:")
  );
  const triggerProduction = router.slice(
    router.indexOf("triggerProductionStart:"),
    router.indexOf("updateProductionStatus:")
  );
  const sendToProduction = router.slice(
    router.indexOf("sendToProduction:"),
    router.indexOf("// ERP KPIs")
  );

  it("mantém o status geral quando o operador apenas aprova a arte do item", () => {
    expect(updatePreProduction).toContain('preProductionStatus: input.preProductionStatus');
    expect(updatePreProduction).not.toContain('status: "em_producao"');
    expect(updatePreProduction).toContain("A aprovação de arte é estritamente do item");
  });

  it("move pedido de um único item para produção somente ao confirmar Produzir", () => {
    expect(triggerProduction).toContain("if (allItemsOfOrder.length === 1)");
    expect(triggerProduction).toContain('status: "em_producao"');
    expect(detail).toContain("setShowProductionConfirm(true)");
    expect(detail).toContain("productionMutation.mutateAsync({ orderItemId, orderId })");
  });

  it("exige todos os itens aprovados antes do envio global para produção", () => {
    expect(sendToProduction).toContain('items.every(i => i.preProductionStatus === "arte_final_aprovada")');
    expect(sendToProduction).toContain('preProductionStatus: "em_producao"');
    expect(sendToProduction).toContain('status: "em_producao"');
    expect(detail).toContain('totalItems ?? 1) > 1');
    expect(detail).toContain('Enviar para Produção');
  });
});
