import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FAQ_CONTENT } from "../client/src/components/TermsAcceptance";

const regionalDeliveryCopy = "Enviamos para diversas cidades do Brasil. Consulte o envio para a sua região.";
const differentialsSource = readFileSync(resolve(process.cwd(), "client/src/components/home/DifferentialsSection.tsx"), "utf8");
const whyChooseUsSource = readFileSync(resolve(process.cwd(), "client/src/components/home/WhyChooseUs.tsx"), "utf8");

describe("comunicação regional de entrega", () => {
  it("não promete entrega para todo o Brasil nos destaques públicos", () => {
    expect(differentialsSource).toContain("Enviamos para diversas cidades do Brasil");
    expect(differentialsSource).toContain("consulte o envio para a sua região");
    expect(whyChooseUsSource).toContain("Enviamos para diversas cidades do Brasil");
    expect(whyChooseUsSource).toContain("Consulte o envio para a sua região");
    expect(differentialsSource).not.toContain("Entrega para todo o Brasil");
    expect(whyChooseUsSource).not.toContain("Entrega para todo o Brasil");
  });

  it("orienta a consulta regional no documento de perguntas frequentes", () => {
    expect(FAQ_CONTENT).toContain(regionalDeliveryCopy);
    expect(FAQ_CONTENT).toContain("modalidades disponíveis podem variar conforme o CEP e o pedido");
    expect(FAQ_CONTENT).not.toContain("A Maria Imprime entrega em todo o Brasil?");
  });
});
