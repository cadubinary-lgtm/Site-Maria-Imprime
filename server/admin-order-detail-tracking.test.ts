import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminOrderDetail.tsx"), "utf8");

describe("acompanhamento visual do pedido administrativo", () => {
  it("inclui Pronto para Entrega antes das etapas de despacho para pedidos com transportadora", () => {
    expect(source).toContain(': [...base, { key: "pronto_entrega" }, { key: "saiu_entrega" }, { key: "em_transporte" }, { key: "entregue" }]');
  });

  it("destaca a etapa cujo status corresponde ao pedido e mantém seu ícone", () => {
    expect(source).toContain("const currentStepIndex = STATUS_STEPS.findIndex((s: any) => s.key === o.status);");
    expect(source).toContain("const isCurrent = i === currentStepIndex;");
    expect(source).toContain('cfg?.icon ?? "●"');
    expect(source).toContain("isCurrent ? \"bg-indigo-600 border-indigo-600 text-white");
  });
});
