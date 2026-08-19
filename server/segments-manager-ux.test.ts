import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/erp/SegmentsManager.tsx"), "utf8");

describe("gestão administrativa de segmentos", () => {
  it("padroniza as ações de criação e reordenação na identidade rosa", () => {
    expect(source).toContain("background: isDragging ? '#fdf2f8'");
    expect(source).toContain('bg-pink-600 hover:bg-pink-700');
    expect(source).not.toContain('bg-orange-500 hover:bg-orange-600');
  });

  it("nomeia os controles de edição, criação e reordenação", () => {
    expect(source).toContain('aria-label={`Reordenar segmento ${segment.name}`}');
    expect(source).toContain('htmlFor="new-segment-name"');
    expect(source).toContain('id="new-segment-slug"');
    expect(source).toContain('aria-label={`Editar segmento ${segment.name}`}');
  });

  it("fornece feedback e estrutura acessíveis para a tabela", () => {
    expect(source).toContain("role={notification.type === 'error' ? 'alert' : 'status'}");
    expect(source).toContain('scope="col"');
    expect(source).toContain('Nenhum segmento cadastrado.');
    expect(source).toContain('bg-red-600 text-white hover:bg-red-700');
  });

  it("apresenta indicadores operacionais e aceita submissão do novo segmento pelo formulário", () => {
    expect(source).toContain('aria-label="Indicadores dos segmentos"');
    expect(source).toContain('Segmentos ativos');
    expect(source).toContain('Sem ícone');
    expect(source).toContain('onSubmit={(event) => { event.preventDefault(); handleCreateSegment(); }}');
    expect(source).toContain('aria-busy={createSegmentMutation.isPending || uploadingIcon}');
  });
});
