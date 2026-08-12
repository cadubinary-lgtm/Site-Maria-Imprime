import { describe, expect, it } from "vitest";
import { getSelectedQuotationSpecifications } from "../client/src/lib/quotationSpecifications";

describe("getSelectedQuotationSpecifications", () => {
  it("retorna somente atributos preenchidos", () => {
    expect(getSelectedQuotationSpecifications('{"width":"1,00","height":"2,00","material":"","finish":"Ilhós"}')).toEqual([
      { key: "width", value: "1,00" },
      { key: "height", value: "2,00" },
      { key: "finish", value: "Ilhós" },
    ]);
  });

  it("aceita atributos selecionados aninhados em snapshots", () => {
    expect(getSelectedQuotationSpecifications('{"selectedAttributes":{"material":"Lona","finish":"Laminação"}}')).toEqual([
      { key: "material", value: "Lona" },
      { key: "finish", value: "Laminação" },
    ]);
  });
});
