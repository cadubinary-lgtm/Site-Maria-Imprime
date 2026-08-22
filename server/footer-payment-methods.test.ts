import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFooterPaymentMethods } from "../client/src/lib/siteContent";

const root = resolve(import.meta.dirname, "..");
const schemaSource = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");
const routerSource = readFileSync(resolve(root, "server/siteContentRouter.ts"), "utf8");
const adminSource = readFileSync(resolve(root, "client/src/pages/admin/AdminFooterInformation.tsx"), "utf8");
const footerSource = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
const siteContentSource = readFileSync(resolve(root, "client/src/lib/siteContent.ts"), "utf8");

describe("formas de pagamento personalizadas no rodapé", () => {
  it("persiste a lista com nome e logo sem depender apenas das sete bandeiras antigas", () => {
    expect(schemaSource).toContain('footerPaymentMethods: text("footerPaymentMethods")');
    expect(routerSource).toContain("paymentMethods: z.array(footerPaymentMethodInput)");
    expect(routerSource).toContain("footerPaymentMethods = JSON.stringify(paymentMethods)");
    expect(siteContentSource).toContain("parseFooterPaymentMethods");
  });

  it("permite enviar e remover logos de imagem protegidas por validação", () => {
    expect(routerSource).toContain("uploadFooterPaymentLogo");
    expect(routerSource).toContain("image/png");
    expect(routerSource).toContain("image/jpeg");
    expect(routerSource).toContain("image/webp");
    expect(routerSource).toContain("site/footer-payment-logos/");
    expect(adminSource).toContain("Remover logo");
    expect(adminSource).toContain("Enviar logo");
  });

  it("mantém exclusão confirmada, ordenação e exibição pública das logos salvas", () => {
    expect(adminSource).toContain("Adicionar cartão");
    expect(adminSource).toContain("Excluir forma de pagamento?");
    expect(adminSource).toContain("moveFooterPaymentMethod");
    expect(footerSource).toContain("footerPaymentMethods.map");
    expect(footerSource).toContain("paymentMethod.logoUrl");
  });

  it("aceita cartões novos, mantém logo removida e preserva a compatibilidade com as bandeiras legadas", () => {
    expect(parseFooterPaymentMethods(JSON.stringify([
      { id: "meu-cartao", label: "Meu Cartão", logoUrl: "/manus-storage/site/minha-logo.webp" },
      { id: "sem-logo", label: "Sem logo", logoUrl: null },
    ]))).toEqual([
      { id: "meu-cartao", label: "Meu Cartão", logoUrl: "/manus-storage/site/minha-logo.webp" },
      { id: "sem-logo", label: "Sem logo", logoUrl: null },
    ]);
    expect(parseFooterPaymentMethods(null, JSON.stringify(["visa", "elo"])).map((method) => method.id)).toEqual(["visa", "elo"]);
  });
});
