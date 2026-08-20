import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/admin/AdminOSPrint.tsx"),
  "utf8",
);

describe("PDF e QR Code da Ordem de Serviço", () => {
  it("oferece exportação de PDF com estado de processamento e nome de arquivo da OS", () => {
    expect(source).toContain("const handleExportPdf = useCallback(async () => {");
    expect(source).toContain('import("html2canvas")');
    expect(source).toContain('import("jspdf")');
    expect(source).toContain('ordem-de-servico-${orderId ?? "documento"}.pdf');
    expect(source).toContain('isExportingPdf ? "Gerando PDF..." : "Exportar PDF"');
  });

  it("isola o QR Code da regra de preenchimento dos SVGs na impressão", () => {
    expect(source).toContain('className="os-qr-code-svg"');
    expect(source).toContain("svg:not(.os-qr-code-svg) path");
    expect(source).toContain('bgColor="#ffffff"');
  });
});
