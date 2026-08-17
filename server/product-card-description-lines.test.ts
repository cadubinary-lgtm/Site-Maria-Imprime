import { describe, expect, it } from "vitest";
import { getCardDescriptionLines, getVisibleCardDescriptionLines, PRODUCT_CARD_DESCRIPTION_LINE_MAX_LENGTH, updateCardDescriptionLine } from "../client/src/lib/product-card-description";

describe("linhas da Descrição do Card", () => {
  it("mantém duas linhas independentes com limite por linha", () => {
    let description = updateCardDescriptionLine("", 0, "Produção no mesmo dia");
    description = updateCardDescriptionLine(description, 1, "Taxa de urgência de R$ 20,00/m²");

    expect(getCardDescriptionLines(description)).toEqual([
      "Produção no mesmo dia",
      "Taxa de urgência de R$ 20,00/m²",
    ]);
    expect(getVisibleCardDescriptionLines(description)).toEqual([
      "Produção no mesmo dia",
      "Taxa de urgência de R$ 20,00/m²",
    ]);
  });

  it("limita cada linha para manter o card em no máximo duas linhas", () => {
    const longLine = "x".repeat(PRODUCT_CARD_DESCRIPTION_LINE_MAX_LENGTH + 10);
    expect(updateCardDescriptionLine("", 0, longLine)).toHaveLength(PRODUCT_CARD_DESCRIPTION_LINE_MAX_LENGTH);
  });
});
