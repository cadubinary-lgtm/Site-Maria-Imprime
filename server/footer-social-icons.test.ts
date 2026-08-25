import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const footerSource = readFileSync(resolve(process.cwd(), "client/src/components/home/Footer.tsx"), "utf8");

describe("ícones sociais do rodapé", () => {
  it("usa o ícone oficial do WhatsApp no atalho da empresa", () => {
    expect(footerSource).toContain('SiWhatsapp');
    expect(footerSource).toContain('<SocialLink href={whatsappHref} label="WhatsApp da Maria Imprime"><SiWhatsapp aria-hidden className="h-5 w-5" /></SocialLink>');
    expect(footerSource).not.toContain('MessageCircle');
  });
});
