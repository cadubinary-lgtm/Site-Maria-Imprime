import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailPath = resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx");

describe("frete por medidas configuradas", () => {
  it("inclui área e metro linear no peso enviado à cotação", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain("const shippingMeasureMultiplier = useMemo");
    expect(source).toContain("if (isM2) return billedArea > 0 ? billedArea : 1");
    expect(source).toContain("if (isMetroLinear) return deadlineLinearMeters > 0 ? deadlineLinearMeters : 1");
    expect(source).toContain("const shippingUnits = qty * shippingMeasureMultiplier");
    expect(source).toContain("const totalWeight = Math.max(0.1, baseWeight * shippingUnits)");
  });

  it("refaz a cotação quando quantidade ou medida configurada mudar", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain("const shippingConfigurationKey = `${quantity}:${shippingMeasureMultiplier.toFixed(4)}`");
    expect(source).toContain("prevShippingConfigurationRef");
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("doCalculateShipping(clean, quantity, shippingQuotesRef.current)");
  });
});
