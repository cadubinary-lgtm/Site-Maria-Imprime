import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FinanceiroPagamentosRetirada.tsx"), "utf8");

describe("central de pagamentos na retirada", () => {
  it("usa rosa nos filtros, números de pedido e ações de transição", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain("border-pink-200 text-pink-700 hover:bg-pink-50");
    expect(source).toContain("text-pink-600");
  });

  it("mantém os status de pagamento e retirada com suas cores semânticas", () => {
    expect(source).toContain('pago: { label: "Pago", color: "bg-green-100 text-green-700"');
    expect(source).toContain('retirado_cliente: { label: "Retirado (Cliente)", color: "bg-emerald-100 text-emerald-700"');
  });

  it("identifica filtros e ações de alteração de status por pedido", () => {
    expect(source).toContain("aria-pressed={filterStatus === k}");
    expect(source).toContain('aria-label={`Alterar pedido ${item.orderNumber} para ${STATUS_CONFIG[ns].label}`}');
    expect(source).toContain("aria-busy={atualizarStatus.isPending}");
  });
});
