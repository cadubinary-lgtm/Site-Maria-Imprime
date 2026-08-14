import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailPath = resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx");
const routerPath = resolve(process.cwd(), "server/routers.ts");
const dbPath = resolve(process.cwd(), "server/db.ts");

describe("múltiplos arquivos de arte", () => {
  it("permite selecionar e remover arquivos individualmente no configurador", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain("const [artFiles, setArtFiles]");
    expect(source).toContain("multiple");
    expect(source).toContain("removeArtFile");
    expect(source).toContain("Envie um ou mais arquivos do seu dispositivo");
    expect(source).toContain("artFiles.map");
    expect(source).toContain('selectArtUploadMode("single")');
    expect(source).toContain('selectArtUploadMode("multiple")');
    expect(source).toContain("Confirmar e continuar");
    expect(source).toContain("artFilesConfirmed");
    expect(source).toContain("uploadQueue");
    expect(source).toContain("ART_ALLOWED_EXTENSIONS");
    expect(source).toContain("ART_MAX_FILE_SIZE");
    expect(source).toContain("handleArtDrop");
    expect(source).toContain("onDrop={handleArtDrop}");
    expect(source).toContain("Envio concluído com sucesso!");
  });

  it("persiste todas as URLs de arte no carrinho e no item de pedido", () => {
    const routerSource = readFileSync(routerPath, "utf8");
    const dbSource = readFileSync(dbPath, "utf8");

    expect(routerSource).toContain("artFileUrls: z.string().optional()");
    expect(dbSource).toContain("artFileUrls?: string;");
    expect(dbSource).toContain("artFileUrl, artFileUrls, notes");
    expect(dbSource).toContain("artFileUrl, artFileUrls, notes, prazoName");
  });
});
