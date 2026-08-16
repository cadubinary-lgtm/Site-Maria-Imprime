import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "client/src/components/home/Testimonials.tsx"),
  "utf8",
);

describe("conteúdo institucional da página inicial", () => {
  it("não apresenta avaliações, autores ou notas não verificáveis", () => {
    expect(source).not.toContain("TESTIMONIALS");
    expect(source).not.toContain("João Silva");
    expect(source).not.toContain("Maria Santos");
    expect(source).not.toContain("rating:");
    expect(source).not.toContain("Star");
  });

  it("mantém uma seção institucional com compromissos de atendimento", () => {
    expect(source).toContain("SERVICE_COMMITMENTS");
    expect(source).toContain("Como cuidamos do seu pedido");
    expect(source).toContain("Atendimento próximo");
  });
});
