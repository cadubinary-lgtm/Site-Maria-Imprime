import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailPath = resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx");

describe("autoavanço do configurador de produto", () => {
  it("abre imediatamente a próxima etapa após medidas, arquivo, link e prazo", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain('setOpenSteps(prev => ({ ...prev, [dimStepIdx]: false, [fileStepIdx]: true }));');
    expect(source).toContain('setOpenSteps(prev => ({ ...prev, [fileStepIdx]: false, [prazoStepIdx]: true }));');
    expect(source).toContain('setOpenSteps(prev => ({ ...prev, [prazoStepIdx]: false, [deliveryStepIdx]: true }));');
    expect(source).not.toContain('}, 400);');
    expect(source).not.toContain('}, 500);');
    expect(source).not.toContain('}, 800);');
    expect(source).not.toContain('}, 2000);');
  });

  it("mantém a consulta automática de CEP separada do avanço das etapas", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain('setTimeout(() => handleCepSearch(v), 100);');
    expect(source).toContain("requestAnimationFrame(() => {");
  });
});
