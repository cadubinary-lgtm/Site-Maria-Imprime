import { describe, expect, it } from "vitest";
import { buildQuotationWhatsappUrl, normalizeWhatsappPhone } from "../client/src/lib/quotationWhatsappShare";

describe("quotation WhatsApp share", () => {
  it("normaliza números brasileiros sem código do país", () => {
    expect(normalizeWhatsappPhone("(22) 99945-9596")).toBe("5522999459596");
  });

  it("mantém o código do país e codifica a mensagem", () => {
    expect(buildQuotationWhatsappUrl("5522999459596", "Olá, orçamento 10")).toBe("https://wa.me/5522999459596?text=Ol%C3%A1%2C%20or%C3%A7amento%2010");
  });
});
