import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const newProductSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminNewProduct.tsx"), "utf8");
const adminsSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminsManager.tsx"), "utf8");

describe("auditoria de identidade visual administrativa", () => {
  it("mantém o destaque de logística do cadastro de produto na marca rosa", () => {
    expect(newProductSource).toContain('className="w-4 h-4 text-pink-600" aria-hidden="true"');
  });

  it("não mantém CTAs laranja nos formulários de gestão de administradores", () => {
    expect(adminsSource).not.toContain("bg-orange-500 hover:bg-orange-600");
    expect(adminsSource).toContain("bg-pink-600 hover:bg-pink-700");
  });
});
