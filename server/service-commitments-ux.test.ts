import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("compromissos públicos de atendimento", () => {
  it("apresenta compromissos institucionais sem avaliações ou depoimentos fabricados", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/Testimonials.tsx"), "utf8");

    expect(source).toContain("SERVICE_COMMITMENTS");
    expect(source).toContain("Como cuidamos do seu pedido");
    expect(source).not.toContain("Depoimento");
    expect(source).not.toContain("Avaliação");
    expect(source).not.toContain("★★★★★");
  });

  it("usa uma lista acessível, títulos semânticos e ícones decorativos", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/Testimonials.tsx"), "utf8");

    expect(source).toContain('aria-labelledby="service-commitments-title"');
    expect(source).toContain('aria-label="Compromissos de atendimento"');
    expect(source).toContain("<ul");
    expect(source).toContain("<h3");
    expect(source).toContain('aria-hidden="true"');
  });
});
