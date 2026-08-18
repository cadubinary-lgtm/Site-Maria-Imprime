import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("diferenciais públicos da Maria Imprime", () => {
  it("organiza os diferenciais em uma lista responsiva e associada ao título", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/WhyChooseUs.tsx"), "utf8");

    expect(source).toContain('aria-labelledby="why-choose-us-title"');
    expect(source).toContain('aria-label="Diferenciais da Maria Imprime"');
    expect(source).toContain("sm:grid-cols-2");
    expect(source).toContain("lg:grid-cols-4");
    expect(source).toContain("<ul");
  });

  it("evita deslocamentos fixos e marca as ilustrações como decorativas", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/WhyChooseUs.tsx"), "utf8");

    expect(source).not.toContain("paddingLeft: '70px'");
    expect(source).not.toContain("marginTop: '-42px'");
    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain("border-pink-100");
  });
});
