import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const router = readFileSync(resolve(process.cwd(), "server/routers-financeiro.ts"), "utf8");
const form = readFileSync(resolve(process.cwd(), "client/src/pages/admin/FinanceiroReciboAvulso.tsx"), "utf8");
const list = readFileSync(resolve(process.cwd(), "client/src/pages/admin/FinanceiroRecibos.tsx"), "utf8");
const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

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

  it("oferece criação editável, itens dinâmicos e acesso pela página de recibos", () => {
    expect(form).toContain("const addItem");
    expect(form).toContain("const removeItem");
    expect(form).toContain("Novo item");
    expect(form).toContain("Emitir recibo avulso");
    expect(list).toContain("Criar recibo");
    expect(list).toContain("getRecibosAvulsos.useQuery");
    expect(app).toContain('path="/admin/financeiro/recibos/avulso/novo"');
    expect(app).toContain('path="/admin/financeiro/recibos/avulso/:id/imprimir"');
  });
});
