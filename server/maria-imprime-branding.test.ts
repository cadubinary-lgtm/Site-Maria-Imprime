import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("transição de marca Maria Imprime", () => {
  const emailService = readFileSync("server/emailService.ts", "utf8");
  const footer = readFileSync("client/src/components/home/Footer.tsx", "utf8");
  const indexHtml = readFileSync("client/index.html", "utf8");

  it("aplica remetente, logotipo e paleta Maria Imprime aos e-mails automáticos", () => {
    expect(emailService).toContain('const FROM_NAME = "Maria Imprime"');
    expect(emailService).toContain("logo-maria-imprime_acc5585b.webp");
    expect(emailService).toContain("background:#ec0069");
    expect(emailService).not.toContain("Gráfica Ponto Digital");
  });

  it("mantém a marca Maria Imprime no título público e a exceção legal no rodapé", () => {
    expect(indexHtml).toContain("<title>Maria Imprime - Gráfica Online</title>");
    expect(footer).toContain("© 2026 Maria Imprime / Gráfica Ponto Digital. Todos os direitos reservados.");
  });
});
