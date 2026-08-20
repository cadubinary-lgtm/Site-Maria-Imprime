import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "client/src/components/products/DeliveryOptionsManager.tsx"),
  "utf8",
);

describe("DeliveryOptionsManager — avanço automático", () => {
  it("aplica a confirmação de 1000 ms aos campos editáveis do prazo", () => {
    expect(source).toContain('import { scheduleProductPriceAutoAdvance } from "@/lib/product-price-auto-advance";');
    expect(source).toContain('placeholder="Ex: Prazo Normal, 24 Horas, Mesmo Dia"');
    expect(source).toContain('setFormData({ ...formData, name: e.target.value });');
    expect(source).toContain('setFormData({ ...formData, daysToDeliver: parseInt(e.target.value) || 0 });');
    expect(source.match(/scheduleProductPriceAutoAdvance\(e\.currentTarget\)/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
