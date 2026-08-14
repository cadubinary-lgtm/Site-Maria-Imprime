export const PRODUCT_GALLERY_MAX_IMAGES = 6;

export function getAvailableGallerySlots(galleryUrls: string[], limit = PRODUCT_GALLERY_MAX_IMAGES): number[] {
  return Array.from({ length: limit }, (_, index) => index).filter((index) => !galleryUrls[index]);
}

export function placeGalleryImages(galleryUrls: string[], slots: number[], imageUrls: string[]): string[] {
  const nextGallery = [...galleryUrls];
  imageUrls.forEach((url, index) => {
    const slot = slots[index];
    if (slot !== undefined) nextGallery[slot] = url;
  });
  return nextGallery;
}
