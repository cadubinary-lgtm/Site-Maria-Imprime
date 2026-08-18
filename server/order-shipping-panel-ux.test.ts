import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const panelSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/orders/OrderShippingPanel.tsx"), "utf8");
const detailSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminOrderDetail.tsx"), "utf8");

describe("painel de logística e entrega", () => {
  it("interpreta frete zero como grátis e preserva a estimativa quando disponível", () => {
    expect(panelSource).toContain("const shippingAmount = Number(shippingPrice ?? 0)");
    expect(panelSource).toContain('shippingAmount > 0');
    expect(panelSource).toContain("Previsão: até {shippingEstimatedDays}");
  });

  it("exibe dados reais de método, destinatário e endereço de forma semântica", () => {
    expect(panelSource).toContain("shippingLabel?.trim() || configuredMethod?.label || shippingMethod");
    expect(panelSource).toContain('aria-label="Endereço de entrega"');
    expect(panelSource).toContain("deliveryFullName");
    expect(panelSource).toContain("O endereço de entrega ainda não foi informado no pedido.");
  });

  it("recebe os dados logísticos disponíveis nos detalhes administrativos", () => {
    expect(detailSource).toContain("shippingLabel={o.shippingLabel}");
    expect(detailSource).toContain("shippingEstimatedDays={o.shippingEstimatedDays}");
    expect(detailSource).toContain("deliveryFullName={o.deliveryFullName}");
  });
});
