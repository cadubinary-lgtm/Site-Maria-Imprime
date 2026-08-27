import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailPath = resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx");

describe("redação dos prazos de entrega", () => {
  it("mantém hoje e amanhã somente para a entrega local", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain("Receba HOJE! (Entrega Local)");
    expect(source).toContain("Receba amanhã! (Entrega Local)");
  });

  it("apresenta a transportadora como previsão estimada, sem promessa de recebimento", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain("Previsão: até ${totalDays}");
    expect(source).toContain("Previsão estimada após a confirmação da produção, sujeita à operação da transportadora.");
    expect(source).not.toContain("return `Receba em ${totalDays} dias úteis`");
  });
});
