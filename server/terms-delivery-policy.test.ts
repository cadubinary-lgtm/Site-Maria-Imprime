import { describe, expect, it } from "vitest";
import { FAQ_CONTENT, PRODUCTION_DEADLINE_CONTENT, TERMS_OF_SALE_CONTENT } from "../client/src/components/TermsAcceptance";

describe("documentação de prazo de entrega", () => {
  it("explica que o transporte é estimado pela transportadora e prevê suporte em atrasos externos", () => {
    expect(TERMS_OF_SALE_CONTENT).toContain("estimativa calculada pela transportadora");
    expect(TERMS_OF_SALE_CONTENT).toContain("condições climáticas, greves");
    expect(TERMS_OF_SALE_CONTENT).toContain("prestará suporte ao cliente");
    expect(PRODUCTION_DEADLINE_CONTENT).toContain("áreas de risco");
    expect(FAQ_CONTENT).toContain("A Maria Imprime oferece suporte");
  });
});
