export const QUOTATION_AUTO_ADVANCE_MS = 800;

export type QuotationAutoAdvanceTarget = {
  blur: () => void;
  __quotationAutoAdvanceTimer?: ReturnType<typeof globalThis.setTimeout>;
};

/**
 * Aguarda uma pausa de digitação antes de confirmar um campo monetário pelo blur.
 * O timer pertence ao próprio campo para que uma nova tecla sempre reinicie a contagem.
 */
export function scheduleQuotationAutoAdvance(target: QuotationAutoAdvanceTarget) {
  if (target.__quotationAutoAdvanceTimer) {
    globalThis.clearTimeout(target.__quotationAutoAdvanceTimer);
  }

  target.__quotationAutoAdvanceTimer = globalThis.setTimeout(() => {
    target.__quotationAutoAdvanceTimer = undefined;
    target.blur();
  }, QUOTATION_AUTO_ADVANCE_MS);
}
