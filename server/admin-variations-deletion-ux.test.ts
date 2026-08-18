import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cvSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminVariationsCv.tsx"), "utf8");
const offsetSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminVariationsOffset.tsx"), "utf8");

describe("exclusões nos gerenciadores de variações", () => {
  it.each([cvSource, offsetSource])("substitui confirmações nativas por diálogo acessível", (source) => {
    expect(source).toContain("<AlertDialog open={Boolean(pendingDeletion)}");
    expect(source).toContain("confirmDelete");
    expect(source).not.toContain("confirm(");
  });

  it.each([cvSource, offsetSource])("nomeia exclusões de tipos e opções", (source) => {
    expect(source).toContain('aria-label={`Excluir tipo de variação ${vt.name}`}');
    expect(source).toContain('aria-label={`Excluir opção de variação ${opt.name}`}');
    expect(source).toContain("aria-busy={deleteTypeMutation.isPending || deleteOptionMutation.isPending}");
  });
});
