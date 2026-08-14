import { describe, expect, it } from "vitest";
import { PRODUCT_IMAGE_LAYOUT } from "../client/src/lib/product-image-layout";

describe("layout compacto das fotos de produto", () => {
  it("alinha as colunas pelo topo e agrupa miniaturas em uma área organizada", () => {
    expect(PRODUCT_IMAGE_LAYOUT.compactColumns).toContain("xl:items-start");
    expect(PRODUCT_IMAGE_LAYOUT.galleryPanel).not.toContain("border");
    expect(PRODUCT_IMAGE_LAYOUT.sectionHeader).toContain("justify-between");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailImage).toContain("right-8");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailImage).toContain("rounded-lg");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailActions).toContain("justify-between");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailActionIcon).toContain("text-red-500");
  });
});
