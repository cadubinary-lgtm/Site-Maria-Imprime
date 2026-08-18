import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { appendCalculatorDigit } from "../client/src/components/calculators/CalculadoraGrafica";

const root = resolve(import.meta.dirname, "..");

describe("experiência pública da calculadora gráfica", () => {
  it("associa rótulos, ajuda e ação de limpar ao campo numérico", () => {
    const source = readFileSync(resolve(root, "client/src/components/calculators/CalculadoraGrafica.tsx"), "utf8");

    expect(source).toContain("useId");
    expect(source).toContain("useRef");
    expect(source).toContain("aria-describedby={helperId}");
    expect(source).toContain("aria-label={`Limpar ${label}`}");
    expect(source).toContain("focus-visible:border-pink-500");
    expect(source).toContain("skipNativeInput.current = true");
    expect(source).toContain("skipNativeInput.current = false");
  });

  it("comunica a estimativa como demonstração e anuncia os resultados", () => {
    const source = readFileSync(resolve(root, "client/src/pages/public/CalculadoraDemo.tsx"), "utf8");

    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("Estimativa de demonstração");
    expect(source).toContain("Este valor é apenas ilustrativo");
    expect(source).toContain("Voltar ao início");
  });

  it("insere os dígitos pela direita independentemente da posição do cursor", () => {
    expect(appendCalculatorDigit(0, "1")).toBe(1);
    expect(appendCalculatorDigit(1, "2")).toBe(12);
    expect(appendCalculatorDigit(123, "4")).toBe(1234);
    expect(appendCalculatorDigit(9_999_999_999, "9")).toBe(9_999_999_999);
  });
});
