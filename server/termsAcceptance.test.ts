import { describe, expect, it } from "vitest";
import { ART_APPROVAL_CONTENT, COOKIES_POLICY_CONTENT, PRIVACY_POLICY_CONTENT, PRODUCTION_DEADLINE_CONTENT, RETURNS_CANCELLATIONS_CONTENT, TERMS_OF_SALE_CONTENT, TERMS_VERSION } from "../client/src/components/TermsAcceptance";

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

  it("inclui a política de produção e prazos fornecida", () => {
    expect(PRODUCTION_DEADLINE_CONTENT).toContain("Prazo de Produção Não é Prazo de Entrega");
    expect(PRODUCTION_DEADLINE_CONTENT).toContain("Produção em Grandes Formatos");
    expect(PRODUCTION_DEADLINE_CONTENT).toContain("Situações Excepcionais");
  });

  it("inclui a política de trocas, cancelamentos e reembolsos fornecida", () => {
    expect(RETURNS_CANCELLATIONS_CONTENT).toContain("Direito de Arrependimento");
    expect(RETURNS_CANCELLATIONS_CONTENT).toContain("Análise Técnica");
    expect(RETURNS_CANCELLATIONS_CONTENT).toContain("Prazo para Comunicação");
  });

  it("inclui a política de privacidade e o e-mail de contato informado", () => {
    expect(PRIVACY_POLICY_CONTENT).toContain("E-mail de contato: contatomariaimprime@gmail.com");
    expect(PRIVACY_POLICY_CONTENT).toContain("Direitos do Titular");
    expect(PRIVACY_POLICY_CONTENT).toContain("Política de Cookies");
  });

  it("inclui a política de cookies sem declarar serviços de analytics não confirmados", () => {
    expect(COOKIES_POLICY_CONTENT).toContain("contatomariaimprime@gmail.com");
    expect(COOKIES_POLICY_CONTENT).toContain("cart_session");
    expect(COOKIES_POLICY_CONTENT).toContain("não declara individualmente ferramentas analíticas");
    expect(COOKIES_POLICY_CONTENT).not.toContain("Google Analytics");
  });
});
