import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const heroSectionPath = resolve(process.cwd(), "client/src/components/home/HeroSection.tsx");

describe("conteúdo do banner principal", () => {
  it("mantém a chamada Pede pra Maria em uma segunda linha", () => {
    const source = readFileSync(heroSectionPath, "utf8");

    expect(source).toContain("Precisou imprimir?<br />");
    expect(source).toContain('Pede pra{" "}');
    expect(source).toContain('<span style={{ color: "#E6005C" }}>Maria.</span>');
    expect(source).not.toContain('Pedi pra{" "}');
  });
});
