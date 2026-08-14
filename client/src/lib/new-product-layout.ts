export const NEW_PRODUCT_FIELD_LAYOUT = {
  grid: "grid grid-cols-1 gap-3 xl:grid-cols-12",
  name: "xl:col-span-4",
  calculation: "xl:col-span-3",
  price: "xl:col-span-2",
  segment: "xl:col-span-3",
  description: "xl:col-span-12",
  segmentsAlignment: "xl:pt-[86px]",
} as const;

export const EDIT_PRODUCT_MODAL_LAYOUT = {
  dialog: "w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-[96vw] xl:max-w-[1480px] max-h-[92dvh] overflow-y-auto p-4 sm:p-6",
  details: "grid grid-cols-1 gap-3 xl:grid-cols-12",
  name: "xl:col-span-4",
  calculation: "xl:col-span-3",
  price: "xl:col-span-2",
  description: "xl:col-span-12",
  measureFields: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6",
  secondary: "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start",
} as const;
