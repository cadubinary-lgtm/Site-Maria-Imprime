import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ShipmentsManager.tsx"), "utf8");

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
});
