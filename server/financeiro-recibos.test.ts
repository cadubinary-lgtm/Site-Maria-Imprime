import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schema = readFileSync(resolve(import.meta.dirname, "../drizzle/schema.ts"), "utf8");
const financeRouter = readFileSync(resolve(import.meta.dirname, "../server/routers-financeiro.ts"), "utf8");
const receivables = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FinanceiroContasReceber.tsx"), "utf8");
const receiptHub = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FinanceiroRecibos.tsx"), "utf8");
const receiptPrint = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FinanceiroReciboPrint.tsx"), "utf8");
const navigation = readFileSync(resolve(import.meta.dirname, "../client/src/components/AdminLayout.tsx"), "utf8");
const app = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
const emailService = readFileSync(resolve(import.meta.dirname, "../server/emailService.ts"), "utf8");

describe("central financeira de recibos", () => {
  it("cria recibos únicos vinculados ao pedido confirmado", () => {
    expect(schema).toContain('export const paymentReceipts = mysqlTable("paymentReceipts"');
    expect(schema).toContain('orderId: int("orderId").notNull().unique()');
    expect(financeRouter).toContain("ensurePaymentReceipt");
    expect(financeRouter).toContain("receiptNumber = `REC-");
    expect(financeRouter).toContain("receiptId: receipt.id");
    expect(financeRouter).toContain("receiptNumber: receipt.receiptNumber");
  });

  it("mantém ações explícitas de impressão, WhatsApp preparado e e-mail enviado", () => {
    expect(financeRouter).toContain("prepareReceiptWhatsApp:");
    expect(financeRouter).toContain("sendReceiptEmail:");
    expect(financeRouter).toContain("whatsappPreparedAt");
    expect(financeRouter).toContain("emailSentAt");
    expect(emailService).toContain("sendPaymentReceiptEmail");
    expect(receivables).toContain("Recibo gerado");
    expect(receivables).toContain("Revise a mensagem e envie-a ao cliente no WhatsApp.");
    expect(receivables).toContain("Recibo enviado por e-mail");
  });

  it("expõe a central e o documento imprimível no financeiro", () => {
    expect(navigation).toContain('{ label: "Recibos", href: "/admin/financeiro/recibos" }');
    expect(app).toContain('path="/admin/financeiro/recibos" component={FinanceiroRecibos}');
    expect(app).toContain('path="/admin/financeiro/recibos/:id/imprimir" component={FinanceiroReciboPrint}');
    expect(receiptHub).toContain("Comprovantes gerados automaticamente após a confirmação de pagamentos.");
    expect(receiptPrint).toContain("RECIBO");
    expect(receiptPrint).toContain("@media print");
  });

  it("configura feedback administrativo sem duplicidade para a confirmação", () => {
    expect(receivables).toContain('position: "top-right"');
    expect(receivables).toContain('duration: 3500');
    expect(receivables).toContain('id: `payment-confirmed-receipt-${data.receiptId}`');
  });

  it("inclui observações da empresa e envia o recibo automaticamente quando há e-mail", () => {
    expect(receiptPrint).toContain("Observações da empresa");
    expect(receiptPrint).toContain("Este documento não substitui a nota fiscal quando sua emissão for aplicável.");
    expect(emailService).toContain("Observações da empresa");
    expect(financeRouter).toContain("if (recipientEmail && !receipt.emailSentAt)");
    expect(financeRouter).toContain("receiptEmailSent");
    expect(financeRouter).toContain('templateName: "sendPaymentReceiptEmail:auto"');
    expect(receivables).toContain("enviado automaticamente para");
  });
});
