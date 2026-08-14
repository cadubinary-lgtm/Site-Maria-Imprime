import { describe, expect, it } from "vitest";
import { getPreviewImageLabel, getPreviewImages } from "../client/src/lib/product-image-preview";

describe("pré-visualização de imagens de produto", () => {
  it("mantém apenas imagens válidas e informa sua posição", () => {
    const images = getPreviewImages("/principal.webp", ["", "/detalhe-1.webp", "/detalhe-2.webp"]);

    expect(images).toEqual(["/principal.webp", "/detalhe-1.webp", "/detalhe-2.webp"]);
    expect(getPreviewImageLabel(images, "/detalhe-1.webp")).toBe("Imagem 2 de 3");
  });
});
