# Plano de Implementação Incremental: Produtos Configuráveis

## Objetivo

Transformar Adesivo e Lona em produtos configuráveis com variações dinâmicas, sem quebrar a funcionalidade existente.

## Estratégia: Implementação em Fases Pequenas e Testadas

### Fase 1: Preparação (COMPLETO)
- ✅ Análise da estrutura atual
- ✅ Planejamento do schema
- ✅ Documentação das mudanças

### Fase 2: Criar Dois Produtos Base (PRÓXIMA)

**Objetivo:** Adicionar dois produtos principais: Adesivo e Lona

**Ações:**
1. Criar script SQL para inserir os dois produtos
2. Marcar como `isConfigurable = true`
3. Testar se aparecem no catálogo

**SQL:**
```sql
INSERT INTO products (name, description, price, segment, isConfigurable, requiresAreaCalculation, isActive)
VALUES 
  ('Adesivo', 'Adesivos personalizados com múltiplas opções de material, acabamento e impressão', '0.00', 'servicos', true, true, true),
  ('Lona', 'Lonas personalizadas com várias opções de mídia, gramatura e acabamento', '0.00', 'servicos', true, true, true);
```

### Fase 3: Implementar Variações no Backend

**Objetivo:** Criar procedures tRPC para gerenciar variações

**Estrutura:**
- `variations.createType` - Criar tipo de variação
- `variations.createOption` - Criar opção dentro de um tipo
- `variations.getByProduct` - Listar todas as variações de um produto
- `variations.updateOption` - Editar opção
- `variations.deleteOption` - Deletar opção

**Exemplo de Uso:**
```typescript
// Criar tipo de variação
await trpc.variations.createType.mutate({
  productId: 1, // ID do Adesivo
  type: "tipo_impressao",
  name: "Tipo de Impressão",
  isRequired: true,
  displayOrder: 1
});

// Criar opção dentro do tipo
await trpc.variations.createOption.mutate({
  variationTypeId: 1,
  name: "Eco Solvente",
  priceModifier: "0.00",
  displayOrder: 1
});
```

### Fase 4: Criar Interface Admin

**Objetivo:** Interface para gerenciar variações no painel admin

**Componentes:**
- `VariationManager.tsx` - Gerenciador de variações
- Modal para criar/editar tipos
- Modal para criar/editar opções
- Listagem com drag-and-drop para reordenar

### Fase 5: Seletor de Variações no Frontend

**Objetivo:** Componente para cliente selecionar variações

**Componentes:**
- `VariationSelector.tsx` - Seletor de variações
- Exibição condicional (ex: gramatura só para Lona Brilho/Fosca)
- Cálculo de preço em tempo real

### Fase 6: Cálculo de Preços

**Objetivo:** Integrar cálculo de preços com variações

**Lógica:**
```
Preço Final = Preço Base + Soma dos Modificadores das Opções Selecionadas
```

### Fase 7: Testes

**Objetivo:** Escrever testes para cada fase

**Testes:**
- Testes de CRUD de variações
- Testes de cálculo de preços
- Testes de validação condicional
- Testes de fluxo completo

### Fase 8: Checkpoint Final

**Objetivo:** Salvar versão funcional

---

## Estrutura de Dados: Adesivo

| Tipo de Variação | Opções | Preço Modificador |
|---|---|---|
| Tipo de Impressão | Eco Solvente, UV | 0.00, 50.00 |
| Tipo de Mídia | Brilho, Fosco, Transparente, Blackout | 0.00, 10.00, 15.00, 20.00 |
| Tipo de Material | Promocional, Premium | 0.00, 30.00 |
| Tipo de Acabamento | Refile, Meio Corte, Corte Total, Sem Acabamento | 0.00, 5.00, 10.00, 0.00 |

---

## Estrutura de Dados: Lona

| Tipo de Variação | Opções | Preço Modificador | Condicional |
|---|---|---|---|
| Tipo de Impressão | Eco Solvente, UV | 0.00, 50.00 | - |
| Tipo de Mídia | Brilho, Fosca, Backlight, Sanet | 0.00, 10.00, 25.00, 30.00 | - |
| Tipo de Gramatura | 280g, 380g, 440g, 1000x1000 fios | 0.00, 10.00, 20.00, 15.00 | Apenas para Brilho/Fosca |
| Tipo de Acabamento | Bainha e Ilhós, Bainha e Ilhós + Reforço, Bainha e Ilhós + Verniz, Bainha e Ilhós + Reforço + Verniz, Sem acabamento + Verniz, Nenhum acabamento | 0.00, 15.00, 20.00, 35.00, 10.00, 0.00 | - |

---

## Pontos de Atenção

1. **Validação Condicional:** Gramatura só deve aparecer para Lona Brilho/Fosca
2. **Preço Base:** Adesivo e Lona começam com preço 0.00 (calculado a partir das variações)
3. **Compatibilidade:** Manter compatibilidade com calculadora de m²
4. **Testes:** Cada fase deve ter testes antes de passar para a próxima
5. **Incrementalidade:** Não quebrar funcionalidade existente

---

## Timeline Estimada

- Fase 2: 30 minutos
- Fase 3: 1 hora
- Fase 4: 1.5 horas
- Fase 5: 1 hora
- Fase 6: 30 minutos
- Fase 7: 1 hora
- Fase 8: 15 minutos

**Total: ~5.5 horas**
