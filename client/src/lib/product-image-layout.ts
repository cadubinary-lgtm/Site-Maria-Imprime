export const PRODUCT_IMAGE_LAYOUT = {
  compactColumns: "grid gap-5 sm:grid-cols-[132px_minmax(0,1fr)]",
  sectionHeader: "flex min-h-5 items-center",
  galleryPanel: "grid grid-cols-3 gap-2 bg-transparent p-0",
  galleryHint: "mt-2 text-xs leading-5 text-gray-500",
  thumbnailImage: "absolute inset-y-0 left-0 right-8 overflow-hidden rounded-lg",
  thumbnailActions: "absolute inset-y-0 right-0 z-10 flex w-8 flex-col items-center justify-between bg-transparent py-1",
  thumbnailActionIcon: "rounded-md p-1 text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-600 focus-visible:bg-pink-50 focus-visible:text-pink-600 focus-visible:outline-none",
} as const;
