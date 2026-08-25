import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PRIVACY_POLICY_CONTENT } from "../client/src/components/TermsAcceptance";

const checkoutSource = readFileSync(resolve(process.cwd(), "client/src/pages/ecommerce/CheckoutPage.tsx"), "utf8");

describe("política própria e localização opcional", () => {
  it("documenta a localização opcional de forma própria na Política de Privacidade", () => {
    expect(PRIVACY_POLICY_CONTENT).toContain("MARIA IMPRIME");
    expect(PRIVACY_POLICY_CONTENT).toContain("Última atualização: 25 de agosto de 2026");
    expect(PRIVACY_POLICY_CONTENT).toContain("Localização opcional");
    expect(PRIVACY_POLICY_CONTENT).toContain("não armazena a coordenada geográfica como dado do pedido");
    expect(PRIVACY_POLICY_CONTENT).toContain("A recusa da permissão não impede a navegação nem a conclusão da compra");
  });

  it("solicita localização somente após ação voluntária e usa a resposta para sugerir o endereço", () => {
    expect(checkoutSource).toContain("navigator.geolocation.getCurrentPosition");
    expect(checkoutSource).toContain("Usar minha localização");
    expect(checkoutSource).toContain("A coordenada serve somente para sugerir o endereço nesta sessão");
    expect(checkoutSource).toContain("setLocationCoordinates(null)");
    expect(checkoutSource).not.toContain("localStorage.setItem");
    expect(checkoutSource).not.toContain("sessionStorage.setItem");
  });
});
