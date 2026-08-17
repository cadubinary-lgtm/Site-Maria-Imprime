import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const newProductSource = readFileSync(resolve(process.cwd(), "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");
const editProductSource = readFileSync(resolve(process.cwd(), "client/src/pages/admin/AdminProducts.tsx"), "utf8");
const cardSource = readFileSync(resolve(process.cwd(), "client/src/components/products/PublicProductCard.tsx"), "utf8");

describe("Descrição do Card de produto", () => {
  it("persiste o texto comercial no produto em criação e edição", () => {
    expect(schemaSource).toContain('cardDescription: varchar("cardDescription", { length: 180 })');
    expect(routerSource).toContain("cardDescription: z.string().max(180).optional()");
    expect(routerSource).toContain("updateData.cardDescription = input.cardDescription.trim() || null");
    expect(newProductSource).toContain("cardDescription: createForm.cardDescription.trim()");
    expect(editProductSource).toContain('cardDescription: (editForm as any).cardDescription?.trim() || ""');
  });

  it("oferece o campo abaixo das tags e prioriza seu texto no card público", () => {
    expect(newProductSource).toContain('htmlFor="create-card-description"');
    expect(editProductSource).toContain('htmlFor="edit-card-description"');
    expect(cardSource).toContain("const cardDescription = product.cardDescription?.trim()");
    expect(cardSource).toContain("cardDescription || sameDayUrgency");
  });
});
