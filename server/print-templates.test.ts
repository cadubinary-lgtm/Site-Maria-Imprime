import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Central de Gabaritos", () => {
  it("persiste a biblioteca de arquivos e o vínculo opcional no produto", () => {
    const schema = read("drizzle/schema.ts");
    const migration = read("drizzle/0069_create_print_templates.sql");
    expect(schema).toContain('export const printTemplates = mysqlTable("printTemplates"');
    expect(schema).toContain('templateId: int("templateId")');
    expect(migration).toContain("CREATE TABLE `printTemplates`");
    expect(migration).toContain("ALTER TABLE `products` ADD COLUMN `templateId` int");
  });

  it("protege a administração e entrega apenas gabaritos publicados ao cliente", () => {
    const router = read("server/printTemplatesRouter.ts");
    expect(router).toContain("listAdmin: adminOrManusAuthProcedure");
    expect(router).toContain("create: adminOrManusAuthProcedure");
    expect(router).toContain("remove: adminOrManusAuthProcedure");
    expect(router).toContain('import { adminOrManusAuthProcedure } from "./routers-admin-auth"');
    expect(router).toContain("listPublic: publicProcedure");
    expect(router).toContain("getPublicForProduct: publicProcedure");
    expect(router).toContain("eq(printTemplates.isPublished, true)");
    expect(router).toContain("await db.update(products).set({ templateId: null })");
  });

  it("oferece o vínculo no novo produto, na edição e no detalhe público", () => {
    const newProduct = read("client/src/pages/admin/AdminNewProduct.tsx");
    const editProduct = read("client/src/pages/admin/AdminProducts.tsx");
    const detail = read("client/src/pages/ecommerce/ProductDetail.tsx");
    expect(newProduct).toContain("Gabarito recomendado");
    expect(newProduct).toContain("templateId: createForm.templateId");
    expect(editProduct).toContain("Gabarito recomendado");
    expect(editProduct).toContain("templateId: (editForm as any).templateId ?? null");
    expect(detail).toContain("trpc.printTemplates.getPublicForProduct.useQuery");
    expect(detail).toContain("Gabarito para este produto");
  });

  it("preserva o gabarito ao editar o produto e disponibiliza o arquivo publicado para download", () => {
    const editProduct = read("client/src/pages/admin/AdminProducts.tsx");
    const publicPage = read("client/src/pages/public/PrintTemplatesPage.tsx");
    const router = read("server/printTemplatesRouter.ts");
    expect(editProduct).toContain("templateId: product.templateId ?? null");
    expect(editProduct).toContain('value={(editForm as any).templateId ? String((editForm as any).templateId) : "none"}');
    expect(editProduct).toContain("templateId: (editForm as any).templateId ?? null");
    expect(publicPage).toContain("trpc.printTemplates.listPublic.useQuery");
    expect(publicPage).toContain('href={template.fileUrl} target="_blank" rel="noopener noreferrer" download');
    expect(router).toContain("eq(printTemplates.isPublished, true)");
  });

  it("permite pesquisar a biblioteca pública em uma lista vertical compacta", () => {
    const publicPage = read("client/src/pages/public/PrintTemplatesPage.tsx");
    expect(publicPage).toContain('const [searchTerm, setSearchTerm] = useState("")');
    expect(publicPage).toContain("const filteredTemplates = useMemo");
    expect(publicPage).toContain('id="template-search"');
    expect(publicPage).toContain("Buscar por nome, produto ou formato do arquivo");
    expect(publicPage).toContain('role="list"');
    expect(publicPage).toContain('role="listitem"');
    expect(publicPage).toContain("Nenhum gabarito encontrado");
    expect(publicPage).not.toContain("sm:grid-cols-2 lg:grid-cols-3");
  });

  it("aceita ZIP no upload de gabaritos sem manter atalhos redundantes na biblioteca", () => {
    const adminPage = read("client/src/pages/admin/AdminPrintTemplates.tsx");
    const uploadEndpoint = read("server/_core/index.ts");
    expect(adminPage).toContain('"zip"');
    expect(adminPage).toContain("PDF, AI, CDR, PSD, EPS, ZIP, SVG");
    expect(adminPage).not.toContain("Adicionar à biblioteca");
    expect(uploadEndpoint).toContain("'application/zip'");
    expect(uploadEndpoint).toContain("'application/x-zip-compressed'");
    expect(uploadEndpoint).toContain("'zip'");
  });

  it("expõe a página pública no rodapé e a gestão nas configurações do site", () => {
    const app = read("client/src/App.tsx");
    const footer = read("client/src/components/home/Footer.tsx");
    const sidebar = read("client/src/components/AdminLayout.tsx");
    const publicPage = read("client/src/pages/public/PrintTemplatesPage.tsx");
    const adminPage = read("client/src/pages/admin/AdminPrintTemplates.tsx");
    expect(app).toContain('path="/gabaritos" component={PrintTemplatesPage}');
    expect(app).toContain('path="/admin/configuracoes-site/gabaritos" component={AdminPrintTemplates}');
    expect(footer).toContain('{ label: "Gabaritos", href: "/gabaritos" }');
    expect(sidebar).toContain('{ label: "Gabaritos", href: "/admin/configuracoes-site/gabaritos" }');
    expect(publicPage).toContain('download className="inline-flex min-h-10');
    expect(publicPage).toContain("/>Baixar</a>");
    expect(adminPage).toContain("Adicionar gabarito");
    expect(adminPage).not.toContain("Adicionar à biblioteca");
    expect(adminPage).toContain('onClick={openNewTemplate}');
    expect(adminPage).toContain("AlertDialog");
    expect(adminPage).toContain('htmlFor="template-file-input"');
    expect(adminPage).toContain('id="template-file-input"');
    expect(adminPage).toContain("cursor-pointer opacity-0");
    expect(adminPage).toContain("const handleFileDrop");
    expect(adminPage).toContain("onDrop={handleFileDrop}");
    expect(adminPage).toContain("Selecionar arquivo ou arrastar aqui");
    expect(adminPage).toContain("Arraste o arquivo para a área acima ou clique para selecionar.");
    expect(adminPage).not.toContain('accept=".pdf');
    expect(adminPage).not.toContain("fileInputRef.current?.click()");
  });
});
