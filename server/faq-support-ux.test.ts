import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("bloco público de atendimento", () => {
  it("mantém uma composição responsiva sem dimensões ou cortes fixos", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/FAQSupport.tsx"), "utf8");

    expect(source).toContain("lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.25fr)]");
    expect(source).toContain("w-48 max-w-full");
    expect(source).not.toContain("overflow-hidden");
    expect(source).not.toContain("minHeight:");
  });

  it("identifica a seção, nomeia a ação externa e oferece fallback de e-mail", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/FAQSupport.tsx"), "utf8");

    expect(source).toContain('aria-labelledby="faq-support-title"');
    expect(source).toContain('aria-label="Falar com a Maria pelo WhatsApp em nova aba"');
    expect(source).toContain("company.supportEmail");
    expect(source).toContain("HOME_SECONDARY_ACTION_CLASS");
    expect(source).toContain('aria-label="Diferenciais do atendimento"');
  });
});
