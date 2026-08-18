import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../client/src/components/products/ConfiguradorVisual.tsx"),
  "utf8",
);

describe("configurador visual de produtos", () => {
  it("calcula o progresso a partir das seleções atuais sem divisão por zero", () => {
    expect(source).toContain("const completedSteps = visibleSteps.filter(isStepComplete)");
    expect(source).toContain("visibleSteps.length > 0");
    expect(source).toContain("aria-valuenow={completionPercentage}");
  });

  it("expõe cada etapa como controle expansível e região nomeada", () => {
    expect(source).toContain("aria-expanded={isExpanded}");
    expect(source).toContain("aria-controls={stepContentId}");
    expect(source).toContain('role="region"');
    expect(source).toContain("aria-labelledby={stepHeadingId}");
  });

  it("aplica a identidade rosa e evita colisões de identificadores nas opções", () => {
    expect(source).toContain("bg-pink-600");
    expect(source).toContain("optionId(attr.id)");
    expect(source).toContain("aria-pressed={selectedValue === String(qty)}");
    expect(source).toContain("focus-visible:ring-pink-300");
  });
});
