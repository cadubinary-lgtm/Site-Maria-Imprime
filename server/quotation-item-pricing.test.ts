import { describe, expect, it } from "vitest";
import {
  parseQuotationCurrency,
  resolveQuotationItemTotal,
  roundQuotationMoney,
} from "../client/src/lib/quotationItemPricing";

describe("cálculo de ajuste de item de orçamento", () => {
  it("interpreta valores monetários brasileiros", () => {
    expect(parseQuotationCurrency("R$ 1.600,00")).toBe(1600);
    expect(parseQuotationCurrency("350,50")).toBe(350.5);
  });

  it("faz o ajuste definir o total desejado e calcula o valor unitário", () => {
    expect(resolveQuotationItemTotal(350, 2)).toEqual({ totalPrice: 350, unitPrice: 175 });
  });

  it("arredonda o unitário para duas casas sem alterar o total desejado", () => {
    expect(resolveQuotationItemTotal(100, 3)).toEqual({ totalPrice: 100, unitPrice: 33.33 });
    expect(roundQuotationMoney(33.333333)).toBe(33.33);
  });
});
