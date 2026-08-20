export const PRODUCT_PRICE_AUTO_ADVANCE_MS = 1000;

export type ProductPriceAutoAdvanceTarget = {
  blur: () => void;
  __productPriceAutoAdvanceTimer?: ReturnType<typeof globalThis.setTimeout>;
};

/** Confirma um campo editável após 1000 ms sem nova digitação. */
export function scheduleProductPriceAutoAdvance(target: ProductPriceAutoAdvanceTarget) {
  if (target.__productPriceAutoAdvanceTimer) {
    globalThis.clearTimeout(target.__productPriceAutoAdvanceTimer);
  }

  target.__productPriceAutoAdvanceTimer = globalThis.setTimeout(() => {
    target.__productPriceAutoAdvanceTimer = undefined;
    target.blur();
  }, PRODUCT_PRICE_AUTO_ADVANCE_MS);
}
