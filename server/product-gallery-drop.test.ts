import { describe, expect, it } from "vitest";
import { getAvailableGallerySlots, placeGalleryImages } from "../client/src/lib/product-gallery-drop";

describe("envio de arquivos soltos na galeria", () => {
  it("preenche apenas as vagas disponíveis, preservando as imagens existentes", () => {
    const gallery = ["/foto-2.webp", "", "/foto-4.webp"];
    const slots = getAvailableGallerySlots(gallery);

    expect(slots).toEqual([1, 3, 4, 5]);
    expect(placeGalleryImages(gallery, slots, ["/nova-1.webp", "/nova-2.webp"])).toEqual([
      "/foto-2.webp",
      "/nova-1.webp",
      "/foto-4.webp",
      "/nova-2.webp",
    ]);
  });
});
