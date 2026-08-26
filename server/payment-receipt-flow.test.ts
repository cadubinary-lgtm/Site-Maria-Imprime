import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const receipts = read("server/payment-receipts.ts");
const financeiroRouter = read("server/routers-financeiro.ts");
const settlement = read("server/payment-settlement.ts");

describe("emissão de recibo após pagamento", () => {
  it("mantém a emissão idempotente por pedido em uma rotina compartilhada", () => {
    expect(receipts).toContain("export async function ensurePaymentReceipt");
    expect(receipts).toContain("where(eq(paymentReceipts.orderId, order.id)).limit(1)");
    expect(receipts).toContain("if (existing) return existing");
  });

  it("emite recibo quando o pagamento presencial é confirmado na retirada", () => {
    const pickupMutation = financeiroRouter.slice(financeiroRouter.indexOf("atualizarStatusRetirada:"));
    expect(pickupMutation).toContain("const confirmsPayment");
    expect(pickupMutation).toContain("if (confirmsPayment)");
    expect(pickupMutation).toContain("await ensurePaymentReceipt(");
    expect(pickupMutation).toContain('paidOrder.paymentMethod || "pagar_na_retirada"');
  });

  it("emite recibo quando Pix ou cartão online são liquidados", () => {
    expect(settlement).toContain("import { ensurePaymentReceipt } from \"./payment-receipts\"");
    expect(settlement).toContain("const receipt = await ensurePaymentReceipt(");
    expect(settlement).toContain("receiptId: receipt.id");
  });
});
