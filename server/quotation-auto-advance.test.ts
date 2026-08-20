import { afterEach, describe, expect, it, vi } from "vitest";
import { QUOTATION_AUTO_ADVANCE_MS, scheduleQuotationAutoAdvance } from "../client/src/lib/quotationAutoAdvance";

describe("avanço automático de campos monetários do orçamento", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("confirma o campo somente após 800 ms de pausa", () => {
    vi.useFakeTimers();
    const field = { blur: vi.fn() };

    scheduleQuotationAutoAdvance(field);
    vi.advanceTimersByTime(QUOTATION_AUTO_ADVANCE_MS - 1);
    expect(field.blur).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(field.blur).toHaveBeenCalledTimes(1);
  });

  it("reinicia a contagem quando o operador continua digitando", () => {
    vi.useFakeTimers();
    const field = { blur: vi.fn() };

    scheduleQuotationAutoAdvance(field);
    vi.advanceTimersByTime(500);
    scheduleQuotationAutoAdvance(field);
    vi.advanceTimersByTime(500);
    expect(field.blur).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(field.blur).toHaveBeenCalledTimes(1);
  });
});
