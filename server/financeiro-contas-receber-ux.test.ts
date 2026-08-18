import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FinanceiroContasReceber.tsx"), "utf8");

describe("central financeira de contas a receber", () => {
  it("usa rosa para os controles de navegação e mantém Pix em verde", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain("border-pink-500 bg-pink-50 text-pink-700");
    expect(source).toContain("bg-green-600 hover:bg-green-700 text-white");
  });

  it("identifica filtros, ações por pedido e seleção de pagamento", () => {
    expect(source).toContain('aria-label="Buscar contas a receber"');
    expect(source).toContain('aria-label="Filtrar por forma de pagamento"');
    expect(source).toContain('aria-label={`Gerar Pix para o pedido ${item.orderNumber}`}');
    expect(source).toContain('role="radiogroup" aria-label="Forma de pagamento recebida"');
    expect(source).toContain("aria-checked={selectedPayment === opt.value}");
  });

  it("abre o WhatsApp com proteção contra acesso à janela de origem", () => {
    expect(source).toContain('window.open(data.whatsappUrl, "_blank", "noopener,noreferrer")');
  });
});
