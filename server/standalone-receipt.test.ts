import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const router = readFileSync(resolve(process.cwd(), "server/routers-financeiro.ts"), "utf8");
const form = readFileSync(resolve(process.cwd(), "client/src/pages/admin/FinanceiroReciboAvulso.tsx"), "utf8");
const list = readFileSync(resolve(process.cwd(), "client/src/pages/admin/FinanceiroRecibos.tsx"), "utf8");
const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const printable = readFileSync(resolve(process.cwd(), "client/src/pages/admin/FinanceiroReciboAvulsoPrint.tsx"), "utf8");

describe("recibos avulsos", () => {
  it("mantém recibos avulsos e itens em tabelas separadas dos recibos de pedidos", () => {
    expect(schema).toContain('mysqlTable("standaloneReceipts"');
    expect(schema).toContain('mysqlTable("standaloneReceiptItems"');
    expect(schema).toContain('references(() => standaloneReceipts.id, { onDelete: "cascade" })');
  });

  it("calcula totais no servidor e cria o recibo junto dos itens", () => {
    expect(router).toContain("criarReciboAvulso: adminOrManusAuthProcedure");
    expect(router).toContain("const subtotalInCents");
    expect(router).toContain("O desconto não pode ser maior que o subtotal dos itens.");
    expect(router).toContain("await db.transaction");
    expect(router).toContain("await tx.insert(standaloneReceiptItems)");
  });

  it("protege listagem e detalhe de recibos avulsos com autenticação administrativa", () => {
    expect(router).toContain("getRecibosAvulsos: adminOrManusAuthProcedure");
    expect(router).toContain("getReciboAvulso: adminOrManusAuthProcedure");
  });

  it("permite editar, cancelar de modo auditável e preparar o WhatsApp sem apagar o documento", () => {
    expect(router).toContain("editarReciboAvulso: adminOrManusAuthProcedure");
    expect(router).toContain("standalone_receipt_updated");
    expect(router).toContain("cancelarReciboAvulso: adminOrManusAuthProcedure");
    expect(router).toContain('status: "cancelado"');
    expect(router).toContain("standalone_receipt_cancelled");
    expect(router).toContain("prepareReciboAvulsoWhatsApp: adminOrManusAuthProcedure");
    expect(router).toContain("standalone_receipt_whatsapp_prepared");
  });

  it("oferece criação editável, itens dinâmicos e acesso pela página de recibos", () => {
    expect(form).toContain("const addItem");
    expect(form).toContain("const removeItem");
    expect(form).toContain("Novo item");
    expect(form).toContain('isEditing ? "Salvar alterações" : "Emitir recibo"');
    expect(list).toContain("Criar recibo");
    expect(list).toContain("getRecibosAvulsos.useQuery");
    expect(app).toContain('path="/admin/financeiro/recibos/avulso/novo"');
    expect(app).toContain('path="/admin/financeiro/recibos/avulso/:id/imprimir"');
  });

  it("oferece ações de edição, WhatsApp e cancelamento confirmado sem imprimir o rótulo Avulso", () => {
    expect(form).toContain("editarReciboAvulso.useMutation");
    expect(app).toContain('path="/admin/financeiro/recibos/avulso/:id/editar"');
    expect(printable).toContain("prepareReciboAvulsoWhatsApp.useMutation");
    expect(printable).toContain("cancelarReciboAvulso.useMutation");
    expect(printable).toContain("Cancelar este recibo?");
    expect(printable).toContain("<span className=\"text-sm font-bold tracking-[0.18em]\">RECIBO</span>");
    expect(printable).not.toContain("RECIBO AVULSO");
  });

  it("disponibiliza e-mail e PDF sem exigir um pedido vinculado", () => {
    expect(router).toContain("sendReciboAvulsoEmail: adminOrManusAuthProcedure");
    expect(router).toContain("standalone_receipt_email_sent");
    expect(readFileSync(resolve(process.cwd(), "server/emailService.ts"), "utf8")).toContain("sendStandaloneReceiptEmail");
    const pdf = readFileSync(resolve(process.cwd(), "client/src/lib/export-receipt-pdf.ts"), "utf8");
    expect(pdf).toContain("orderNumber?: string | null");
    expect(pdf).toContain("ITENS DO RECIBO");
  });
});
