import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const adminLayoutSource = readFileSync(resolve(root, "client/src/components/AdminLayout.tsx"), "utf8");
const quotationFormSource = readFileSync(resolve(root, "client/src/pages/admin/AdminQuotationForm.tsx"), "utf8");
const newProductSource = readFileSync(resolve(root, "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");

describe("rolagem dos formulários administrativos longos", () => {
  it("mantém o conteúdo principal do painel em um contêiner verticalmente rolável", () => {
    expect(adminLayoutSource).toContain('className="flex-1 min-h-0 overflow-y-scroll overscroll-contain bg-white"');
  });

  it("fornece rolagem própria ao Novo Orçamento fora do layout administrativo", () => {
    expect(quotationFormSource).toContain('admin-visual-system h-screen overflow-y-scroll overscroll-contain');
  });

  it("mantém Novo Produto com altura mínima compatível com o contêiner rolável do painel", () => {
    expect(newProductSource).toContain('admin-visual-system min-h-full space-y-4 xl:space-y-5');
  });
});
