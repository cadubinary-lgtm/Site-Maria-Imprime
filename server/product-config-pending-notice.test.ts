import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailPath = resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx");

describe("aviso de campos pendentes no configurador", () => {
  it("mantém as mensagens clicáveis sem sublinhado visual", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain('<span className="leading-snug">{field.message}</span>');
    expect(source).not.toContain('<span className="leading-snug underline">{field.message}</span>');
    expect(source).toContain('onClick={() => scrollToField(field.id)}');
  });
});
