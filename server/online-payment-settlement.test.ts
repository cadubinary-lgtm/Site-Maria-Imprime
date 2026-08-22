import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const settlementSource = readFileSync(resolve(root, "server/payment-settlement.ts"), "utf8");
const paymentRouterSource = readFileSync(resolve(root, "server/routers-payment.ts"), "utf8");
const webhookSource = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");
const ordersListSource = readFileSync(resolve(root, "client/src/pages/admin/AdminOrders.tsx"), "utf8");
const orderDetailSource = readFileSync(resolve(root, "client/src/pages/admin/AdminOrderDetail.tsx"), "utf8");

describe("liquidação automática de pagamentos online", () => {
  it("marca o pedido e o lançamento financeiro como pagos sem regredir o status operacional", () => {
    expect(settlementSource).toContain('paymentStatus: "pago"');
    expect(settlementSource).toContain('status: "pago"');
    expect(settlementSource).toContain('formaPagamento: input.paymentMethod');
    expect(settlementSource).not.toContain('status: "pagamento_aprovado"');
  });

  it("sincroniza cartão imediato, polling Pix e webhook com a mesma liquidação", () => {
    expect(paymentRouterSource).toContain('settleApprovedOnlinePayment(db, { orderId: order.id, paymentMethod: "cartao_credito" })');
    expect(paymentRouterSource).toContain('settleApprovedOnlinePayment(db, { orderId: paymentRecord.orderId, paymentMethod: "pix" })');
    expect(webhookSource).toContain("await settleApprovedOnlinePayment(db, { orderId, paymentMethod });");
    expect(webhookSource).not.toContain("updateOrderStatus(orderId, 'pagamento_aprovado'");
  });

  it("exibe o status pago e o método correto na lista e no detalhe do pedido", () => {
    expect(ordersListSource).toContain("PAYMENT_STATUS_LABELS");
    expect(ordersListSource).toContain("PAYMENT_METHOD_LABELS");
    expect(ordersListSource).toContain("Cartão de crédito");
    expect(ordersListSource).toContain("paymentMethod");
    expect(orderDetailSource).toContain('cartao_credito: "Cartão de crédito"');
    expect(orderDetailSource).toContain('cartao_debito: "Cartão de débito"');
  });
});
