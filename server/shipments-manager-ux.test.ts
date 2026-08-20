import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ShipmentsManager.tsx"), "utf8");
const routerSource = readFileSync(resolve(import.meta.dirname, "../server/routers-logistics.ts"), "utf8");

describe("gestão administrativa de envios", () => {
  it("usa rosa para controles de expedição e preserva status logísticos semânticos", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain("bg-orange-100 text-orange-700 shrink-0");
    expect(source).toContain("bg-green-600 hover:bg-green-700 font-semibold");
  });

  it("permite submissão do formulário de expedição por teclado com campos identificados", () => {
    expect(source).toContain('id="shipment-entry-form"');
    expect(source).toContain('form="shipment-entry-form"');
    expect(source).toContain('htmlFor="shipment-order-id"');
    expect(source).toContain('htmlFor="shipment-recipient-document"');
    expect(source).toContain("aria-busy={addToCartMutation.isPending}");
  });

  it("protege a abertura de etiquetas em nova aba", () => {
    expect(source).toContain("'noopener,noreferrer'");
    expect(source).toContain('aria-label={`Imprimir etiqueta do pedido ${shipment.orderId} em nova aba`}');
  });

  it("pré-preenche a expedição com o serviço de frete escolhido no checkout", () => {
    expect(routerSource).toContain("shippingMethod: orders.shippingMethod");
    expect(routerSource).toContain("shippingCarrierId: orders.shippingCarrierId");
    expect(source).toContain("const shippingServiceId = String(order.shippingMethod ?? '').trim();");
    expect(source).toContain("serviceId: isNumericServiceId ? shippingServiceId : '',");
    expect(source).toContain("serviceName: shippingServiceName || String(order.shippingLabel ?? ''),");
    expect(source).toContain("companyName: shippingCompanyName");
    expect(source).toContain("price: String(order.shippingPrice ?? '0')");
    expect(source).toContain("Serviço e transportadora carregados da opção escolhida pelo cliente no checkout.");
  });

  it("prioriza o número comercial do pedido e preserva o ID interno para conferência", () => {
    expect(routerSource).toContain("orderNumber: orders.orderNumber");
    expect(routerSource).toContain("leftJoin(orders, eq(shipments.orderId, orders.id))");
    expect(source).toContain("shipment.orderNumber ? `Pedido ${shipment.orderNumber}` : `Pedido interno #${shipment.orderId}`");
    expect(source).toContain("ID interno: #{shipment.orderId}");
  });
});
