import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FinanceiroContasRecebidas.tsx"), "utf8");

describe("central financeira de contas recebidas", () => {
  it("usa rosa para filtros e navegação, preservando o resumo de pagamento concluído em verde", () => {
    expect(source).toContain("bg-pink-600 text-white hover:bg-pink-700");
    expect(source).toContain("border-pink-200 text-pink-700 hover:bg-pink-50");
    expect(source).toContain("bg-green-50 shadow-sm");
    expect(source).toContain("bg-green-100 text-xs text-green-700");
  });

  it("identifica busca, períodos, datas e ação destrutiva", () => {
    expect(source).toContain('aria-label="Buscar contas recebidas"');
    expect(source).toContain("aria-pressed={periodo === p}");
    expect(source).toContain('id="received-start-date"');
    expect(source).toContain('id="received-end-date"');
    expect(source).toContain('aria-label={`Mover o recebimento do pedido ${item.orderNumber} para a lixeira`}');
  });
});
