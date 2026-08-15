import { describe, expect, it } from "vitest";
import { getProductDashboardMetrics } from "../client/src/lib/product-dashboard-metrics";

describe("indicadores do dashboard de produtos", () => {
  it("apura produtos com imagens e preços configurados a partir do catálogo real", () => {
    expect(getProductDashboardMetrics([
      { id: 1, imageUrl: "/capa.webp", price: 20 },
      { id: 2, galleryUrls: ["/galeria.webp"], pricePerM2: 35 },
      { id: 3, price: 0 },
    ])).toEqual({ total: 3, withImage: 2, withoutImage: 1, withPrice: 2 });
  });
});
