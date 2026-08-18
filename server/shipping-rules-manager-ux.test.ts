import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(import.meta.dirname, '../client/src/pages/admin/ShippingRulesManager.tsx'), 'utf8');

describe('regras locais de entrega', () => {
  it('substitui a confirmação nativa por diálogo acessível e nomeado', () => {
    expect(source).toContain('<AlertDialog open={Boolean(ruleToDelete)}');
    expect(source).toContain('Excluir a regra de entrega de {ruleToDelete?.neighborhood}?');
    expect(source).toContain('aria-label={`Excluir regra de entrega ${rule.neighborhood}`}');
    expect(source).not.toContain('confirm(');
  });

  it('informa processamento e limpa o estado de exclusão somente após sucesso', () => {
    expect(source).toContain('aria-busy={deleteRule.isPending}');
    expect(source).toContain("toast.success('Regra de entrega excluída')");
    expect(source).toContain('setRuleToDelete(null)');
  });

  it('mantém a ação de edição identificada pelo bairro', () => {
    expect(source).toContain('aria-label={`Editar regra de entrega ${rule.neighborhood}`}');
  });
});
