import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PRODUCT_IMAGE_LAYOUT } from "../client/src/lib/product-image-layout";

const uploaderSource = readFileSync(resolve(process.cwd(), "client/src/components/products/ProductImageUploader.tsx"), "utf8");

describe("layout compacto das fotos de produto", () => {
  it("separa capa e galeria em blocos com miniaturas organizadas", () => {
    expect(PRODUCT_IMAGE_LAYOUT.compactColumns).toContain("sm:grid-cols-[132px_minmax(0,1fr)]");
    expect(PRODUCT_IMAGE_LAYOUT.galleryPanel).toContain("grid-cols-3");
    expect(PRODUCT_IMAGE_LAYOUT.galleryPanel).not.toContain("sm:grid-cols-6");
    expect(PRODUCT_IMAGE_LAYOUT.galleryPanel).not.toContain("border");
    expect(PRODUCT_IMAGE_LAYOUT.sectionHeader).toContain("items-center");
    expect(PRODUCT_IMAGE_LAYOUT.sectionHeader).not.toContain("justify-between");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailImage).toContain("right-8");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailImage).toContain("rounded-lg");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailActions).toContain("justify-between");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailActionIcon).toContain("text-gray-400");
    expect(PRODUCT_IMAGE_LAYOUT.thumbnailActionIcon).toContain("hover:text-pink-600");
  });

  it("organiza a Foto Principal ao lado da galeria em seis slots e com ações abaixo da imagem", () => {
    expect(uploaderSource).not.toContain('relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer');
    expect(uploaderSource).toContain('Fotos Adicionais (até 6)');
    expect(uploaderSource).toContain('Arraste para reordenar');
    expect(uploaderSource).toContain('Clique em um slot vazio para adicionar');
    expect(uploaderSource).toContain('aria-label="Adicionar ou substituir foto principal"');
    expect(uploaderSource).toContain('aria-label="Excluir foto principal"');
    expect(uploaderSource).toContain('setIsMainImageDeleteConfirmOpen(true)');
    expect(uploaderSource).not.toContain('Capa do produto');
    expect(uploaderSource).not.toContain('Foto de capa');
    expect(uploaderSource).not.toContain('Defina a imagem que será exibida como capa no catálogo.');
  });
});
