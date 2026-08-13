import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const kanbanPath = resolve(process.cwd(), "client/src/pages/admin/AdminKanban.tsx");
const prePrintPath = resolve(process.cwd(), "client/src/pages/admin/AdminPreImpressao.tsx");
const productionPath = resolve(process.cwd(), "client/src/pages/admin/AdminStatusProducao.tsx");
const quickDialogPath = resolve(process.cwd(), "client/src/components/admin/ProductionQuickDetailsDialog.tsx");

describe("alertas e detalhes rápidos da Linha de Produção", () => {
  it("destaca pedidos que permanecem em análise por dois dias ou mais", () => {
    const source = readFileSync(kanbanPath, "utf8");

    expect(source).toContain('const isAnalysisDelayed = order.status === "analisando" && daysInCurrentCol >= 2;');
    expect(source).toContain("bg-amber-50 border-amber-300 ring-1 ring-amber-200");
    expect(source).toContain("Em análise há {daysInCurrentCol} dias");
  });

  it("abre detalhes rápidos pelos badges de Pré-Impressão e Status de Produção", () => {
    const prePrint = readFileSync(prePrintPath, "utf8");
    const production = readFileSync(productionPath, "utf8");

    expect(prePrint).toContain('onClick={() => setQuickDetailsStatus(s)}');
    expect(prePrint).toContain("<ProductionQuickDetailsDialog");
    expect(production).toContain('onClick={() => setQuickDetailsStatus(s)}');
    expect(production).toContain("<ProductionQuickDetailsDialog");
  });

  it("carrega os produtos do pedido ao abrir o modal rápido", () => {
    const source = readFileSync(quickDialogPath, "utf8");

    expect(source).toContain("trpc.checkout.getOrderById.useQuery");
    expect(source).toContain("item.productName");
    expect(source).toContain("Ver pedido");
  });

  it("exibe a hora de criação e não mostra valores nos cards operacionais", () => {
    const prePrint = readFileSync(prePrintPath, "utf8");
    const production = readFileSync(productionPath, "utf8");

    for (const source of [prePrint, production]) {
      expect(source).toContain('new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })');
      expect(source).toContain("{fmtTime(order.createdAt)} • {fmtDate(order.createdAt)}");
      expect(source).not.toContain("fmt(Number(order.totalAmount ?? order.totalPrice ?? 0))");
    }
  });
});
