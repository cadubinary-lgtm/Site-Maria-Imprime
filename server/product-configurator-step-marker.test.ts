import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx"),
  "utf8",
);

describe("marcador das etapas do configurador", () => {
  it("mantém o círculo numerado em metade do tamanho anterior", () => {
    expect(productDetailSource).toContain("w-3 h-3 rounded-full text-[7px] leading-none font-bold");
    expect(productDetailSource).not.toContain("w-6 h-6 rounded-full text-xs font-bold");
  });

  it("preserva o botão e o fluxo de abertura das etapas", () => {
    expect(productDetailSource).toContain("onClick={onToggle}");
    expect(productDetailSource).toContain("{isOpen && (");
    expect(productDetailSource).toContain("{number}");
  });
});
