import { describe, expect, it } from "vitest";
import { formatCompanyAddress, formatCompanyContact } from "./companyQuotationDetails";

describe("company quotation details", () => {
  const company = {
    commercialPhone: "(22) 99945-9596",
    whatsappNumber: "5522999459596",
    supportEmail: "contato@mariaimprime.com",
    street: "Rua das Flores",
    addressNumber: "651",
    neighborhood: "Centro",
    city: "Campos dos Goytacazes",
    state: "RJ",
    zipCode: "28010-000",
  };

  it("inclui telefone, WhatsApp e e-mail quando cadastrados", () => {
    expect(formatCompanyContact(company)).toContain("WhatsApp: 5522999459596");
    expect(formatCompanyContact(company)).toContain("contato@mariaimprime.com");
  });

  it("monta o endereço completo com cidade, UF e CEP", () => {
    expect(formatCompanyAddress(company)).toBe("Rua das Flores · Nº 651 · Centro · Campos dos Goytacazes/RJ · CEP 28010-000");
  });
});
