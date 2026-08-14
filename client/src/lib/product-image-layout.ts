export const PRODUCT_IMAGE_LAYOUT = {
  compactColumns: "grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)] xl:items-start",
  sectionHeader: "flex min-h-5 items-center justify-between gap-2",
  galleryPanel: "grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-white p-2",
  galleryHint: "mt-2 text-xs leading-5 text-gray-500",
  thumbnailImage: "absolute inset-y-0 left-0 right-8 overflow-hidden",
  thumbnailActions: "absolute inset-y-0 right-0 z-10 flex w-8 flex-col items-center justify-between border-l border-gray-200 bg-white/95 py-1",
} as const;
