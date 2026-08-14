export function getPreviewImages(mainImageUrl: string, galleryUrls: string[]): string[] {
  return [mainImageUrl, ...galleryUrls].filter((url): url is string => Boolean(url?.trim()));
}

export function getPreviewImageLabel(previewImages: string[], activeUrl: string): string {
  const position = previewImages.indexOf(activeUrl) + 1;
  return position > 0 ? `Imagem ${position} de ${previewImages.length}` : "Imagem do produto";
}
