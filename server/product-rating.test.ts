import { describe, expect, it } from "vitest";
import { getProductRatingDisplay } from "../client/src/lib/product-rating";

describe("exibição de avaliações de produto", () => {
  it("formata avaliações reais em uma única informação de resumo", () => {
    expect(getProductRatingDisplay({ rating: 4.9, reviewCount: 248 })).toEqual({
      rating: "4,9",
      reviewCount: 248,
    });
  });

  it("não cria avaliação quando o produto não possui dados reais", () => {
    expect(getProductRatingDisplay({})).toBeNull();
    expect(getProductRatingDisplay({ rating: 4.9, reviewCount: 0 })).toBeNull();
  });
});
