import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/NotasFiscais.tsx"), "utf8");

describe("cancelamento de notas fiscais", () => {
  it("substitui confirmação nativa por diálogo acessível", () => {
    expect(source).toContain("<AlertDialog open={Boolean(noteToCancel)}");
    expect(source).toContain("handleConfirmCancel");
    expect(source).not.toContain("confirm(");
  });

  it("identifica a nota e comunica processamento no cancelamento", () => {
    expect(source).toContain('aria-label={`Cancelar nota fiscal ${note.noteNumber || `#${note.id}`}`}');
    expect(source).toContain("aria-busy={updateNoteStatus.isPending}");
    expect(source).toContain("setNoteToCancel(null)");
  });
});
