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

  it("inclui UNIT. após QTD e trata o ajuste como total desejado", () => {
    expect(formSource).toContain('<div className="text-center">Unit.</div>');
    expect(formSource).toContain('title="Informe o valor total desejado para este item"');
    expect(formSource).toContain("const adjusted = resolveQuotationItemTotal(updates.priceAdjustment, quantity);");
    expect(formSource).toContain("item.totalPrice = adjusted.totalPrice;");
  });

  it("mantém UNIT. com duas casas, tamanho legível e feedback de recálculo", () => {
    expect(formSource).toContain("minimumFractionDigits: 2");
    expect(formSource).toContain("maximumFractionDigits: 2");
    expect(formSource).toContain("grid-cols-[32px_minmax(108px,1fr)_32px_58px_92px_96px_96px_32px]");
    expect(formSource).toContain("autoRecalculatedUnitItems.has(idx)");
    expect(formSource).toContain("Valor unitário recalculado a partir do ajuste.");
    expect(formSource).toContain("font-semibold tabular-nums");
  });

  it("aplica o mesmo padrão de QTD e UNIT. aos itens personalizados", () => {
    expect(formSource).toContain("grid-cols-[32px_minmax(108px,1fr)_32px_58px_92px_96px_96px_32px]");
    expect(formSource).toContain("Valor unitário recalculado a partir do total do item personalizado.");
    expect(formSource).toContain("updateItem(idx, { priceAdjustment: value });");
    expect(formSource).toContain('title="Informe o valor total desejado para este item personalizado"');
    expect(formSource).toContain('<div className="text-center">Ajuste</div>');
  });

  it("oferece campos inferiores sincronizados para os Produtos e Serviços expandidos", () => {
    expect(formSource).toContain('aria-label={`Quantidade inferior de ${item.productName}`}');
    expect(formSource).toContain('aria-label={`Valor unitário inferior de ${item.productName}`}');
    expect(formSource).toContain('aria-label={`Valor total inferior de ${item.productName}`}');
    expect(formSource).toContain('key={`product-total-${idx}-${item.totalPrice}`}');
    expect(formSource).toContain("Valor unitário inferior recalculado a partir do ajuste.");
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
