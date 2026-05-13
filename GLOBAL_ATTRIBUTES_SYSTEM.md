# Sistema Global Inteligente de Atributos

## Visão Geral

O **Sistema Global Inteligente de Atributos** é uma arquitetura profissional que permite gerenciar atributos de produtos de forma centralizada e dinâmica, com regras de compatibilidade automáticas por categoria/material.

### Objetivos Alcançados

✅ **Arquitetura sem refatoração**: Utiliza estrutura existente (schema, engine, routers)  
✅ **Atributos globais reutilizáveis**: Material, Acabamento, Ilhós, Bastão, Laminação, Dobra  
✅ **Regras dinâmicas por categoria**: Lona, Folheto, Adesivo, Placa com compatibilidade específica  
✅ **Visibilidade condicional**: Atributos aparecem/desaparecem automaticamente baseado em seleções  
✅ **Validação em tempo real**: Frontend renderiza apenas atributos compatíveis  
✅ **Escalabilidade**: Novos produtos e atributos podem ser adicionados sem código  

---

## Arquitetura Técnica

### 1. Camada de Banco de Dados

#### Tabelas Principais

```sql
-- Atributos globais (reutilizáveis)
attributes (id, name, slug, description, type, basePrice, displayOrder, isActive)

-- Valores de atributos
attributeValues (id, attributeId, value, priceModifier, timeModifier, weightModifier, isActive)

-- Vinculação produto-atributo
productAttributes (id, productId, attributeId, isRequired, allowMultiple, priceModifier, calculationType, isActive, priority)

-- Valores habilitados por produto
productAttributeValues (id, productAttributeId, attributeValueId, isEnabled, priceModifier)

-- Regras dinâmicas
attributeRules (id, productId, name, description, isActive)
attributeRuleConditions (id, ruleId, attributeId, operator, value)
attributeRuleActions (id, ruleId, targetAttributeId, action, value)
```

#### IDs dos Atributos Globais

| Atributo | ID | Slug | Tipo | Uso |
|----------|----|----|------|-----|
| Material | 30001 | material | select | Obrigatório em todos os produtos |
| Acabamento | 30002 | acabamento | select | Opcional em todos os produtos |
| Ilhós | 62 | ilhos | select | Apenas Lona |
| Bastão | 64 | bastao | select | Apenas Lona |
| Laminação | 30004 | laminacao | select | Folheto, Adesivo |
| Dobra | 30005 | dobra | select | Apenas Folheto |

#### IDs dos Produtos de Teste

| Produto | ID | Categoria | Atributos |
|---------|----|-----------| ---|
| Lona 280g Brilho | 840001 | Lona | Material, Acabamento, Ilhós, Bastão |
| Folheto A4 Couchê 300g | 840002 | Folheto | Material, Acabamento, Laminação, Dobra |
| Adesivo Vinil 10x10cm | 840003 | Adesivo | Material, Acabamento, Laminação |
| Placa PVC 20x30cm | 840004 | Placa | Material, Acabamento |

---

## Regras de Compatibilidade

### LONA (Produto ID: 840001)

#### Regra 1: Mostrar Ilhós e Bastão
- **Condição**: Material = "Lona 280g"
- **Ações**: 
  - Mostrar Ilhós
  - Mostrar Bastão
- **Propósito**: Lona requer acabamentos específicos para penduração

#### Regra 2: Ocultar Laminação e Dobra
- **Condição**: Material = "Lona 280g"
- **Ações**:
  - Ocultar Laminação
  - Ocultar Dobra
- **Propósito**: Lona não é compatível com esses acabamentos

### FOLHETO (Produto ID: 840002)

#### Regra 1: Mostrar Dobra
- **Condição**: Material = "Papel Couchê 300g"
- **Ações**: Mostrar Dobra
- **Propósito**: Folhetos podem ser dobrados

#### Regra 2: Ocultar Ilhós e Bastão
- **Condição**: Nenhuma (sempre ativa)
- **Ações**:
  - Ocultar Ilhós
  - Ocultar Bastão
- **Propósito**: Folhetos não usam esses acabamentos

### ADESIVO (Produto ID: 840003)

#### Regra 1: Ocultar Dobra
- **Condição**: Nenhuma (sempre ativa)
- **Ações**: Ocultar Dobra
- **Propósito**: Adesivos não podem ser dobrados

#### Regra 2: Ocultar Ilhós e Bastão
- **Condição**: Nenhuma (sempre ativa)
- **Ações**:
  - Ocultar Ilhós
  - Ocultar Bastão
- **Propósito**: Adesivos não usam esses acabamentos

### PLACA (Produto ID: 840004)

#### Regra 1: Ocultar Dobra, Ilhós e Bastão
- **Condição**: Nenhuma (sempre ativa)
- **Ações**:
  - Ocultar Dobra
  - Ocultar Ilhós
  - Ocultar Bastão
- **Propósito**: Placas rígidas não usam esses acabamentos

---

## Fluxo de Funcionamento

### 1. Carregamento Inicial

```
ProductDetail.tsx
  ↓
trpc.attributes.getProductAttributes(productId)
  ↓
Retorna: [
  { id: 1, attributeId: 30001, name: "Material", values: [...] },
  { id: 2, attributeId: 30002, name: "Acabamento", values: [...] },
  { id: 3, attributeId: 62, name: "Ilhós", values: [...] },
  ...
]
```

### 2. Carregamento de Regras

```
ProductDetail.tsx
  ↓
trpc.attributes.getProductRules(productId)
  ↓
Retorna: [
  {
    id: 1,
    name: "Lona requer Ilhós e Bastão",
    conditions: [{ attributeId: 30001, operator: "equals", value: "Lona 280g" }],
    actions: [
      { targetAttributeId: 62, action: "show" },
      { targetAttributeId: 64, action: "show" }
    ]
  },
  ...
]
```

### 3. Processamento de Regras (Client-side)

```
processRules(rules, selectedAttributes, initialState)
  ↓
Para cada regra ativa:
  - Avaliar condições com selectedAttributes
  - Se todas as condições forem verdadeiras:
    - Aplicar ações (show/hide/enable/disable/setPrice/addPrice)
  ↓
Retorna: AttributeState com visibilidade/preço atualizado
```

### 4. Renderização Dinâmica

```
visibleAttributes = productAttributes.filter(pa => 
  attributeState[pa.attributeId].visible !== false
)
  ↓
Renderizar apenas atributos visíveis em ProductDetail
```

---

## Engine de Regras

### Localização

- **Server**: `/server/attributes-engine.ts`
- **Client**: `/client/src/lib/attributes-engine.ts`

### Operadores Suportados

| Operador | Descrição | Exemplo |
|----------|-----------|---------|
| `equals` | Igualdade exata | Material = "Lona 280g" |
| `contains` | Contém substring | Valor contém "Lona" |
| `greaterThan` | Maior que | Quantidade > 100 |
| `lessThan` | Menor que | Quantidade < 50 |
| `in` | Em lista | Material in "Lona,Papel,Vinil" |

### Ações Suportadas

| Ação | Descrição | Uso |
|------|-----------|-----|
| `show` | Mostrar atributo | Tornar visível |
| `hide` | Ocultar atributo | Tornar invisível |
| `enable` | Habilitar atributo | Permitir seleção |
| `disable` | Desabilitar atributo | Bloquear seleção |
| `setPrice` | Definir preço | Preço fixo |
| `addPrice` | Adicionar ao preço | Preço adicional |

---

## Integração com Frontend

### ProductDetail.tsx

```typescript
// 1. Carregar atributos do produto
const { data: productAttributes } = trpc.attributes.getProductAttributes.useQuery(productId);

// 2. Carregar regras do produto
const { data: productRules } = trpc.attributes.getProductRules.useQuery(productId);

// 3. Processar regras
const attributeState = useMemo(() => {
  if (!productAttributes || !productRules) return null;
  
  const initialState = generateInitialState(attributeIds);
  const selectedMap = new Map(Object.entries(selectedAttributes));
  
  return processRules(productRules, selectedMap, initialState);
}, [productAttributes, productRules, selectedAttributes]);

// 4. Filtrar atributos visíveis
const visibleAttributes = useMemo(() => {
  return productAttributes.filter(pa => 
    attributeState[pa.attributeId].visible !== false
  );
}, [productAttributes, attributeState]);

// 5. Renderizar apenas atributos visíveis
return (
  <div>
    {visibleAttributes.map(attr => (
      <DynamicAttributeRenderer key={attr.id} attribute={attr} />
    ))}
  </div>
);
```

---

## Testes de Validação

### Arquivo: `global-attributes-integration.test.ts`

18 casos de teste cobrindo:

✅ Lona: Mostrar Ilhós/Bastão, ocultar Laminação/Dobra  
✅ Folheto: Mostrar Dobra, ocultar Ilhós/Bastão  
✅ Adesivo: Ocultar Dobra, Ilhós/Bastão  
✅ Placa: Ocultar Dobra, Ilhós/Bastão  
✅ Compatibilidade Global: Material e Acabamento em todos  
✅ Múltiplas regras em sequência  
✅ Regras inativas ignoradas  

### Executar Testes

```bash
pnpm test -- global-attributes-integration.test.ts
```

---

## Validação em Produção

### Teste Manual: Produto Lona

1. Abrir: `/produto/840001` (Lona 280g Brilho)
2. Verificar atributos visíveis:
   - ✅ Material (obrigatório)
   - ✅ Acabamento (opcional)
   - ✅ Ilhós (mostrado por regra)
   - ✅ Bastão (mostrado por regra)
   - ❌ Laminação (oculto por regra)
   - ❌ Dobra (oculto por regra)

### Teste Manual: Produto Folheto

1. Abrir: `/produto/840002` (Folheto A4 Couchê 300g)
2. Verificar atributos visíveis:
   - ✅ Material (obrigatório)
   - ✅ Acabamento (opcional)
   - ✅ Laminação (opcional)
   - ✅ Dobra (opcional)
   - ❌ Ilhós (oculto por regra)
   - ❌ Bastão (oculto por regra)

---

## Escalabilidade e Extensão

### Adicionar Novo Atributo Global

1. Criar atributo em `attributes` table
2. Criar valores em `attributeValues` table
3. Vincular a produtos via `productAttributes`
4. Criar regras via `attributeRules` + `attributeRuleConditions` + `attributeRuleActions`

### Adicionar Nova Categoria de Produto

1. Criar produto em `products` table
2. Vincular atributos globais via `productAttributes`
3. Definir regras de compatibilidade via `attributeRules`
4. Sistema renderiza automaticamente no frontend

### Modificar Regras Existentes

1. Editar `attributeRules` (ativar/desativar/renomear)
2. Editar `attributeRuleConditions` (alterar condições)
3. Editar `attributeRuleActions` (alterar ações)
4. Mudanças refletem imediatamente no frontend (sem deploy)

---

## Benefícios da Arquitetura

| Benefício | Descrição |
|-----------|-----------|
| **Sem Refatoração** | Usa estrutura existente, sem mudanças de código |
| **Escalável** | Novos produtos e atributos sem programação |
| **Dinâmico** | Regras podem ser alteradas sem deploy |
| **Reutilizável** | Atributos globais compartilhados entre produtos |
| **Profissional** | Compatibilidade automática por categoria |
| **Testável** | 18+ casos de teste de integração |
| **Performático** | Processamento de regras otimizado (client-side) |

---

## Próximos Passos Recomendados

1. **Expandir Atributos**: Adicionar Tamanho, Quantidade, Cores, etc.
2. **Regras Avançadas**: Dependências entre atributos (ex: Cor só aparece se Material = X)
3. **Precificação Dinâmica**: Modificadores de preço baseados em regras
4. **Admin Panel**: Interface para gerenciar regras sem SQL
5. **Validação de Pedidos**: Validar compatibilidade de atributos selecionados

---

## Referências

- **Schema**: `/drizzle/schema.ts` (linhas 602-802)
- **Engine**: `/server/attributes-engine.ts` e `/client/src/lib/attributes-engine.ts`
- **Routers**: `/server/routers-attributes.ts`
- **Frontend**: `/client/src/pages/ProductDetail.tsx`
- **Testes**: `/server/global-attributes-integration.test.ts` e `/server/conditional-rules.test.ts`

---

## Conclusão

O **Sistema Global Inteligente de Atributos** fornece uma arquitetura profissional e escalável para gerenciar compatibilidade de atributos por categoria de produto, sem refatoração da estrutura existente. O sistema está validado, testado e pronto para produção.

**Status**: ✅ **IMPLEMENTADO E VALIDADO**
