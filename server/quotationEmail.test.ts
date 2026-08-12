import { describe, expect, it } from "vitest";
import { templateQuotationEmail } from "./emailService";

describe("templateQuotationEmail", () => {
  it("inclui os itens, total e condições comerciais do orçamento", () => {
    const html = templateQuotationEmail({
      clientName: "Carlos",
      quotationNumber: "ORC-123",
      total: 680,
      expiresAt: new Date("2026-09-11T12:00:00Z"),
      paymentMethod: "PIX",
      productionDeadline: 3,
      items: [{ productName: "Lona Impressa", quantity: 1, totalPrice: 680 }],
    });

    expect(html).toContain("Orçamento ORC-123");
    expect(html).toContain("Lona Impressa");
    expect(html).toContain("R$ 680,00");
    expect(html).toContain("Prazo de produção:");
  });

  it("escapa dados do cliente antes de renderizar no HTML", () => {
    const html = templateQuotationEmail({
      clientName: "<script>alert(1)</script>",
      quotationNumber: "ORC-124",
      total: 1,
      items: [],
    });

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
