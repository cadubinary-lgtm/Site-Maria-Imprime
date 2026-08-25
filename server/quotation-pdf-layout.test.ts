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
    expect(source).toContain("grid-template-columns:31% 38% 31%");
    expect(source).toContain('class="proposal-block"');
    expect(source).toContain(".brand::after, .proposal-block::after");
    expect(source).toContain("top:14px; bottom:14px");
    expect(source).toContain('className="grid min-h-[160px] grid-cols-1 md:grid-cols-[31%_38%_31%]');
    expect(source).toContain('absolute inset-y-7 right-0 hidden w-px bg-[#b9b9b9]');
    expect(source).not.toContain("md:border-r-2 md:border-gray-300");
    expect(source).toContain("min-h-[230px]");
  });

  it("mantém a faixa de ações no topo da tela e fora da impressão", () => {
    const detailStart = source.indexOf("return (");
    const actionsIndex = source.indexOf("Imprimir PDF", detailStart);
    const headerIndex = source.indexOf('<header className="overflow-hidden', detailStart);

    expect(actionsIndex).toBeGreaterThan(detailStart);
    expect(actionsIndex).toBeLessThan(headerIndex);
    expect(source).toContain('className="no-print flex flex-wrap items-center gap-2 border-b');
    expect(source).toContain('aria-label="Ações do orçamento"');
  });

  it("mantém emissão e validade em uma única linha na tela e na impressão", () => {
    expect(source).toContain(".doc-info .date { font-size:8px; color:#666; margin-top:3px; white-space:nowrap; }");
    expect(source).toContain('whitespace-nowrap text-[clamp(0.65rem,0.75vw,0.78rem)] text-gray-500');
  });
});
