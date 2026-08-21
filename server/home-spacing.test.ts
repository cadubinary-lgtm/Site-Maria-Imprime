import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("espaçamento vertical da página inicial", () => {
  it("compacta o ritmo vertical e mantém os blocos principais no mesmo limite lateral", () => {
    const featuredProducts = read("client/src/components/home/FeaturedProducts.tsx");
    const carousel = read("client/src/components/home/HomeSegmentsCarousel.tsx");
    const howItWorks = read("client/src/components/home/HowItWorks.tsx");
    const checklist = read("client/src/components/home/PrePrintChecklist.tsx");

    const support = read("client/src/components/home/FAQSupport.tsx");

    expect(featuredProducts).toContain("pt-10 pb-3 sm:pt-12 sm:pb-4");
    expect(carousel).toContain("pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-5");
    expect(howItWorks).toContain("pt-5 pb-3 lg:px-8 lg:pt-7 lg:pb-4");
    expect(howItWorks).toContain("mx-auto max-w-7xl");
    expect(checklist).toContain("pt-3 pb-5 lg:px-8");
    expect(checklist).toContain("mx-auto max-w-7xl");
    expect(support).toContain("px-4 py-8 sm:py-10 lg:px-8 lg:py-12");
  });
});
