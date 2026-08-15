import { describe, expect, it } from "vitest";
import { getOperationalQuotationCards, getQuotationProcedure } from "../client/src/lib/quotation-dashboard";

describe("dashboard operacional de orçamentos", () => {
  it("resume o funil pelos procedimentos que exigem ação", () => {
    const cards = getOperationalQuotationCards({ rascunhos: 2, enviados: 3, emNegociacao: 4, aprovados: 5, convertidos: 6 });
    expect(cards.map((card) => card.value)).toEqual([2, 7, 5, 6]);
    expect(cards.map((card) => card.label)).toEqual(["Para enviar", "Aguardando retorno", "Prontos para converter", "Convertidos em pedido"]);
  });

  it("descreve o próximo procedimento a partir do status real", () => {
    expect(getQuotationProcedure("aprovado")).toContain("Converter em pedido");
    expect(getQuotationProcedure("em_negociacao")).toContain("negociação");
    expect(getQuotationProcedure("aprovado", 12)).toContain("Pedido criado");
  });
});
