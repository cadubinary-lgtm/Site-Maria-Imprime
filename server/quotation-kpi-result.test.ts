import { describe, expect, it } from "vitest";
import { extractQuotationKpiRow } from "./quotation-kpi-result";

describe("resultado de indicadores de Orçamentos", () => {
  it("extrai a primeira linha do formato retornado pelo driver SQL", () => {
    expect(extractQuotationKpiRow([[{ enviados: "6", aprovados: "4" }], []])).toEqual({ enviados: "6", aprovados: "4" });
  });

  it("retorna um objeto vazio quando não houver linha de indicador", () => {
    expect(extractQuotationKpiRow([[], []])).toEqual({});
    expect(extractQuotationKpiRow(null)).toEqual({});
  });
});
