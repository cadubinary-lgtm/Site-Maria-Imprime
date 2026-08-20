import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const detailSource = readFileSync(resolve(root, "client/src/pages/admin/AdminQuotationDetail.tsx"), "utf8");
const formSource = readFileSync(resolve(root, "client/src/pages/admin/AdminQuotationForm.tsx"), "utf8");
const routerSource = readFileSync(resolve(root, "server/quotationsRouter.ts"), "utf8");
const schemaSource = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");

describe("cabeçalho do orçamento", () => {
  it("mantém o responsável emissor no cadastro e na persistência", () => {
    expect(schemaSource).toContain('responsibleName: varchar("responsibleName", { length: 150 })');
    expect(routerSource).toContain('responsibleName: z.string().trim().min(1).max(150)');
    expect(routerSource).toContain("responsibleName: input.responsibleName");
    expect(formSource).toContain('id="quotation-responsible-name"');
    expect(formSource).toContain("responsibleName: responsibleName.trim()");
  });

  it("mantém o campo de responsável visível no card de cliente antes dos produtos", () => {
    const clientSection = formSource.indexOf("{/* Seção: Cliente */}");
    const responsibleField = formSource.indexOf('id="quotation-responsible-name"');
    const productsSection = formSource.indexOf("{/* Seção: Produtos */}");

    expect(clientSection).toBeGreaterThan(-1);
    expect(responsibleField).toBeGreaterThan(clientSection);
    expect(responsibleField).toBeLessThan(productsSection);
    expect(formSource).toContain("Nome que será exibido neste orçamento e na impressão.");
  });

  it("mostra endereço, CNPJ e responsável abaixo da logo sem repetir a marca", () => {
    expect(detailSource).toContain("const companyAddress = formatCompanyAddress(company);");
    expect(detailSource).toContain("CNPJ: ${company.cnpj}");
    expect(detailSource).toContain("${companyAddress ? `<p>${companyAddress}</p>` : \"\"}");
    expect(detailSource).toContain("${responsibleName ? `<p><strong>Responsável:</strong> ${responsibleName}</p>` : \"\"}");
    expect(detailSource).toContain("const whatsappIconMarkup = `<svg");
    expect(detailSource).toContain("whatsapp-icon");
    expect(detailSource).toContain("WhatsApp: ${formattedContactPhone}");
    expect(detailSource).not.toContain('const companyLine = [company?.tradeName');
  });

  it("usa o ícone oficial do WhatsApp nas ações do orçamento", () => {
    expect(detailSource).toContain('import { FaWhatsapp } from "react-icons/fa";');
    expect(detailSource).toContain('<FaWhatsapp className="w-3.5 h-3.5" aria-hidden="true" /> WhatsApp');
  });
});
