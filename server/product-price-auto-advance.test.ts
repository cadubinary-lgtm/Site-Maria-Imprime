import { afterEach, describe, expect, it, vi } from "vitest";
import { PRODUCT_PRICE_AUTO_ADVANCE_MS, scheduleProductPriceAutoAdvance } from "../client/src/lib/product-price-auto-advance";

describe("avanço automático dos preços do Novo Produto", () => {
  afterEach(() => vi.useRealTimers());

  it("confirma o valor somente após 1000 ms sem nova digitação", () => {
    vi.useFakeTimers();
    const field = { blur: vi.fn() };

    scheduleProductPriceAutoAdvance(field);
    vi.advanceTimersByTime(PRODUCT_PRICE_AUTO_ADVANCE_MS - 1);
    expect(field.blur).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(field.blur).toHaveBeenCalledTimes(1);
  });

  it("reinicia a contagem ao receber nova digitação", () => {
    vi.useFakeTimers();
    const field = { blur: vi.fn() };

    scheduleProductPriceAutoAdvance(field);
    vi.advanceTimersByTime(700);
    scheduleProductPriceAutoAdvance(field);
    vi.advanceTimersByTime(700);
    expect(field.blur).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(field.blur).toHaveBeenCalledTimes(1);
  });
});
