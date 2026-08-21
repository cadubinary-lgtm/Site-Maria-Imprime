import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("espaçamento vertical da página inicial", () => {
  it("aproxima o carrossel do botão de produtos e compacta o intervalo após Como funciona", () => {
    const featuredProducts = read("client/src/components/home/FeaturedProducts.tsx");
    const carousel = read("client/src/components/home/HomeSegmentsCarousel.tsx");
    const howItWorks = read("client/src/components/home/HowItWorks.tsx");
    const checklist = read("client/src/components/home/PrePrintChecklist.tsx");

    expect(featuredProducts).toContain("pt-16 pb-6 sm:pt-20 sm:pb-8");
    expect(carousel).toContain("pt-0 pb-6 sm:px-6 sm:pt-0 sm:pb-8");
    expect(howItWorks).toContain("pt-8 pb-5 lg:px-8 lg:pt-12 lg:pb-6");
    expect(checklist).toContain("pt-5 pb-10 lg:px-8");
  });
});
