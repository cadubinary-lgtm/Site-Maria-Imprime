import { describe, expect, it } from "vitest";
import { ART_APPROVAL_CONTENT, TERMS_OF_SALE_CONTENT, TERMS_VERSION } from "../client/src/components/TermsAcceptance";

describe("documentação de termos da Maria Imprime", () => {
  it("mantém a apresentação e as cláusulas essenciais fornecidas", () => {
    expect(TERMS_OF_SALE_CONTENT).toContain("MARIA IMPRIME – SUA GRÁFICA ONLINE");
    expect(TERMS_OF_SALE_CONTENT).toContain("23. Disposições Finais");
    expect(TERMS_OF_SALE_CONTENT).toContain("Responsabilidade pela Arte");
  });

  it("versiona o novo conteúdo de termos", () => {
    expect(TERMS_VERSION).toBe("2026-08-12-v2");
  });

  it("inclui o termo de aprovação de arte fornecido", () => {
    expect(ART_APPROVAL_CONTENT).toContain("Responsabilidade pela Conferência");
    expect(ART_APPROVAL_CONTENT).toContain("Aprovação Eletrônica");
    expect(ART_APPROVAL_CONTENT).toContain("Arquivos de Baixa Qualidade");
  });
});
