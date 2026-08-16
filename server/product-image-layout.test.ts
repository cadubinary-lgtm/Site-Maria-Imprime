import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PRODUCT_IMAGE_LAYOUT } from "../client/src/lib/product-image-layout";

const uploaderSource = readFileSync(resolve(process.cwd(), "client/src/components/products/ProductImageUploader.tsx"), "utf8");

describe("layout compacto das fotos de produto", () => {
  it("alinha as colunas pelo topo e agrupa miniaturas em uma área organizada", () => {
    expect(PRODUCT_IMAGE_LAYOUT.compactColumns).toContain("xl:items-start");
    expect(PRODUCT_IMAGE_LAYOUT.galleryPanel).not.toContain("border");
    expect(PRODUCT_IMAGE_LAYOUT.sectionHeader).toContain("justify-between");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailImage).toContain("right-8");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailImage).toContain("rounded-lg");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailActions).toContain("justify-between");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailActionIcon).toContain("text-gray-400");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailActionIcon).toContain("hover:text-pink-600");
  });

  it("organiza a Foto Principal sem contorno pontilhado e com ações no padrão da galeria", () => {
    expect(uploaderSource).not.toContain('relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer');
    expect(uploaderSource).toContain('style={{ gridTemplateColumns: `${compact ? 132 : 180}px minmax(0, 1fr)` }}');
    expect(uploaderSource).toContain('justify-self-start text-[11px] font-medium text-pink-600');
    expect(uploaderSource).toContain('Foto de capa');
    expect(uploaderSource).toContain('aria-label="Substituir foto principal"');
    expect(uploaderSource).toContain('aria-label="Excluir foto principal"');
    expect(uploaderSource).toContain('setIsMainImageDeleteConfirmOpen(true)');
  });
});
