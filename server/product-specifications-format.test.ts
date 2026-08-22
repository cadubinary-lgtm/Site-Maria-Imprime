import { describe, expect, it } from "vitest";
import { formatProductSpecificationItems } from "../client/src/lib/product-specifications";

describe("lista inteligente de especificações técnicas", () => {
  it("separa marcadores, sentenças, rótulos técnicos e seções em itens legíveis", () => {
    const items = formatProductSpecificationItems("• Lona Multiuso Impermeável Premium • Proteção máxima e alta durabilidade. Diferenciais do Produto100% Impermeável: Proteção total contra água e umidade. Proteção UV: Barreira contra raios solares. Especificações TécnicasMaterial: PVC. Gramatura: 440 g/m².");

    expect(items.map((item) => item.text)).toContain("Lona Multiuso Impermeável Premium");
    expect(items.map((item) => item.text)).toContain("Proteção máxima e alta durabilidade.");
    expect(items).toContainEqual({ text: "Diferenciais do Produto", isSection: true });
    expect(items).toContainEqual({ label: "100% Impermeável", text: "Proteção total contra água e umidade.", isSection: false });
    expect(items).toContainEqual({ text: "Especificações Técnicas", isSection: true });
    expect(items).toContainEqual({ label: "Material", text: "PVC.", isSection: false });
    expect(items).toContainEqual({ label: "Gramatura", text: "440 g/m².", isSection: false });
  });

  it("retorna uma lista vazia para conteúdo ausente", () => {
    expect(formatProductSpecificationItems(null)).toEqual([]);
    expect(formatProductSpecificationItems("   ")).toEqual([]);
  });
});
