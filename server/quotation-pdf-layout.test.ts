import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("impressão de Orçamentos", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/admin/AdminQuotationDetail.tsx"),
    "utf8"
  );

  it("oculta metadados internos de itens personalizados e mantém a descrição limpa", () => {
    expect(source).toContain('const TECHNICAL_SPEC_KEYS = new Set(["itemType", "item_type"])');
    expect(source).toContain('if (k === "description")');
    expect(source).toContain('parts.push(String(v));');
  });

  it("imprime a tabela com imagem de produto e arte em colunas separadas", () => {
    expect(source).toContain('<th class="col-art">Arte</th>');
    expect(source).toContain('class="product-image"');
    expect(source).toContain('class="art-image"');
    expect(source).toContain('.col-image { width:8%; }');
  });

  it("organiza o cabeçalho com proposta, identificação e blocos de empresa e cliente", () => {
    expect(source).toContain("Proposta Comercial");
    expect(source).toContain('class="header-details"');
    expect(source).toContain('class="info-panel-title">Dados da Empresa');
    expect(source).toContain('class="info-panel-title">Cliente');
    expect(source).toContain("Identificação do Orçamento");
  });

  it("mantém a composição de referência com três colunas, divisórias e respiro dos cartões", () => {
    expect(source).toContain("grid-template-columns:30% 40% 30%");
    expect(source).toContain('class="proposal-block"');
    expect(source).toContain("border-left:2px solid #b9b9b9");
    expect(source).toContain('className="grid min-h-[160px]');
    expect(source).toContain("md:border-r-2 md:border-gray-300");
    expect(source).toContain("min-h-[230px]");
  });
});
