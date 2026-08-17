import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const indexHtmlPath = resolve(import.meta.dirname, "../client/index.html");

describe("metadados de SEO e compartilhamento", () => {
  it("oferece título, descrição e URLs canônicas da Maria Imprime", () => {
    const indexHtml = readFileSync(indexHtmlPath, "utf8");

    expect(indexHtml).toContain("<title>Maria Imprime | Gráfica Online: Adesivos, Banners e Mais</title>");
    expect(indexHtml).toContain('name="description" content="Gráfica online para adesivos, banners, cartões de visita, fachadas e lonas. Orçamento rápido, produção própria e entrega para todo o Brasil."');
    expect(indexHtml).toContain('rel="canonical" href="https://mariaimprime.com.br/"');
    expect(indexHtml).toContain('name="robots" content="index, follow"');
  });

  it("oferece Open Graph e Twitter Card com a imagem oficial de compartilhamento", () => {
    const indexHtml = readFileSync(indexHtmlPath, "utf8");
    const imageUrl = "https://mariaimprime.com.br/manus-storage/maria-imprime-compartilhamento_0ede79e1.png";

    expect(indexHtml).toContain('property="og:type" content="website"');
    expect(indexHtml).toContain('property="og:locale" content="pt_BR"');
    expect(indexHtml).toContain(`property="og:image" content="${imageUrl}"`);
    expect(indexHtml).toContain('property="og:image:width" content="1200"');
    expect(indexHtml).toContain('property="og:image:height" content="630"');
    expect(indexHtml).toContain(`name="twitter:image" content="${imageUrl}"`);
    expect(indexHtml).toContain('name="twitter:card" content="summary_large_image"');
  });
});
