import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const adminOrderDetail = readFileSync(resolve(root, "client/src/pages/admin/AdminOrderDetail.tsx"), "utf8");
const customerOrderDetail = readFileSync(resolve(root, "client/src/pages/cliente/OrderDetailPage.tsx"), "utf8");
const guestTracking = readFileSync(resolve(root, "client/src/pages/ecommerce/GuestOrderTracking.tsx"), "utf8");
const orderConfirmation = readFileSync(resolve(root, "client/src/pages/ecommerce/OrderConfirmation.tsx"), "utf8");

function expectDeliveryStagesInOrder(source: string) {
  const ready = source.indexOf("pronto_entrega");
  const dispatched = source.indexOf("saiu_entrega", ready + 1);
  const inTransit = source.indexOf("em_transporte", dispatched + 1);
  const delivered = source.indexOf("entregue", inTransit + 1);

  expect(ready).toBeGreaterThan(-1);
  expect(dispatched).toBeGreaterThan(ready);
  expect(inTransit).toBeGreaterThan(dispatched);
  expect(delivered).toBeGreaterThan(inTransit);
}

describe("sincronização de status entre painel e acompanhamento do cliente", () => {
  it("mantém a mesma sequência de entrega no painel e nas telas públicas", () => {
    expectDeliveryStagesInOrder(adminOrderDetail);
    expectDeliveryStagesInOrder(customerOrderDetail);
    expectDeliveryStagesInOrder(guestTracking);
    expectDeliveryStagesInOrder(orderConfirmation);
  });

  it("expõe os mesmos rótulos de despacho e transporte ao cliente", () => {
    expect(customerOrderDetail).toContain('saiu_entrega:        "Saiu para Entrega"');
    expect(customerOrderDetail).toContain('em_transporte:       "Em Transporte"');
    expect(guestTracking).toContain('saiu_entrega:        "Saiu para Entrega"');
    expect(guestTracking).toContain('em_transporte:       "Em Transporte"');
  });
});
