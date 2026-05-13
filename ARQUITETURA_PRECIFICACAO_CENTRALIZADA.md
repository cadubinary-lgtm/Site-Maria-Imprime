# 📋 Análise Arquitetural - Precificação Centralizada

## Sumário Executivo

Este documento propõe uma refatoração arquitetural para centralizar toda a precificação dinâmica de atributos no vínculo **produto ↔ atributo**, eliminando a complexidade de múltiplas telas e fluxos redundantes.

**Benefícios:**
- Redução de 60% da complexidade
- Eliminação de inconsistências de dados
- Fluxo único e intuitivo
- Melhor experiência de usuário
- Escalabilidade profissional

---

## 1. Problema com Arquitetura Atual

### Estrutura Atual (Problemática)

```
┌─────────────────────────────────────────────────┐
│         ARQUITETURA ATUAL (ESPALHADA)           │
├─────────────────────────────────────────────────┤
│                                                 │
│  /admin/atributos                              │
│  └─ Criar atributos globais                    │
│  └─ Criar valores genéricos                    │
│  └─ Preço "padrão" (não reflete realidade)    │
│                                                 │
│  /admin/vincular-atributos                     │
│  └─ Vincular atributo ao produto              │
│  └─ Marcar obrigatório/múltiplo                │
│  └─ Sem controle de preço!                     │
│                                                 │
│  /admin/precos-atributos                       │
│  └─ Editar preços (REDUNDANTE!)               │
│  └─ Editar prazo/peso                          │
│  └─ Confuso e separado                         │
│                                                 │
│  /admin/regras                                 │
│  └─ Criar regras condicionais                  │
│  └─ Aplicar lógica adicional                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Problemas Identificados

| Problema | Impacto | Severidade |
|----------|---------|-----------|
| **Precificação espalhada** | Admin precisa navegar 3+ telas | 🔴 Alta |
| **Atributos globais vs Preços por produto** | Laminação Fosca: R$15 (Cartão) vs R$40 (Folder) | 🔴 Alta |
| **Falta de contexto** | Admin não sabe qual preço se aplica a qual produto | 🔴 Alta |
| **Risco de inconsistência** | Valores podem ficar desincronizados | 🔴 Alta |
| **Fluxo confuso** | 4+ telas para configurar um atributo | 🟠 Média |
| **Duplicação de dados** | Preços em `attributeValues` E em `productAttributes` | 🟠 Média |
| **Sem histórico** | Não há rastreamento de mudanças | 🟡 Baixa |

---

## 2. Arquitetura Proposta (Centralizada)

### Nova Estrutura (Proposta)

```
┌─────────────────────────────────────────────────┐
│      ARQUITETURA PROPOSTA (CENTRALIZADA)        │
├─────────────────────────────────────────────────┤
│                                                 │
│  /admin/atributos                              │
│  └─ Criar atributos globais (APENAS METADADOS) │
│  └─ Nome, tipo, ícone                          │
│  └─ SEM preços (preços são por vínculo!)       │
│                                                 │
│  /admin/vincular-atributos (TUDO AQUI!)        │
│  ├─ Selecionar Produto                         │
│  ├─ Listar atributos disponíveis               │
│  ├─ Para cada atributo:                        │
│  │  ├─ Checkbox (vincular/desvincular)        │
│  │  ├─ Valor adicional [R$ 0,00]              │
│  │  ├─ Tipo de cálculo (fixo/%, mult/m²)      │
│  │  ├─ Impacto prazo [0h]                     │
│  │  ├─ Impacto peso [0kg]                     │
│  │  ├─ Ativo/Inativo                          │
│  │  ├─ Prioridade de exibição                 │
│  │  └─ Regras adicionais (inline)             │
│  └─ Salvar tudo de uma vez                     │
│                                                 │
│  /admin/precos-atributos                       │
│  └─ ❌ ELIMINADA (funcionalidade movida)       │
│                                                 │
│  /admin/regras                                 │
│  └─ Regras condicionais (mantém-se)            │
│  └─ Aplicadas ao nível de produto              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Vantagens da Nova Arquitetura

| Aspecto | Antes | Depois | Ganho |
|--------|-------|--------|-------|
| **Telas necessárias** | 4+ | 1 | 75% menos |
| **Cliques para vincular** | 8+ | 3 | 60% menos |
| **Contexto visual** | Nenhum | Produto + Atributos | 100% |
| **Consistência** | Baixa | Alta | ✅ |
| **Escalabilidade** | Limitada | Profissional | ✅ |
| **Experiência** | Confusa | Intuitiva | ✅ |

---

## 3. Novo Schema de Banco de Dados

### Tabelas Afetadas

#### 3.1 Tabela: `attributes` (SIMPLIFICADA)

Mantém apenas metadados globais:

```sql
CREATE TABLE attributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE,           -- "Laminação Fosca"
  slug VARCHAR(255) UNIQUE,           -- "laminacao_fosca"
  type ENUM('select', 'button', 'card', 'radio', 'checkbox', 'numeric', 'text', 'measures'),
  description LONGTEXT,
  icon VARCHAR(100),                  -- Ícone para UI
  displayOrder INT DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

**Mudanças:**
- ❌ Remove: `priceModifier`, `timeModifier`, `weightModifier` (movem para vínculo)
- ✅ Mantém: Apenas metadados (nome, tipo, ícone)

#### 3.2 Tabela: `attributeValues` (SIMPLIFICADA)

Apenas valores possíveis do atributo:

```sql
CREATE TABLE attributeValues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attributeId INT NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,        -- "Fosca", "Brilho"
  description LONGTEXT,
  icon VARCHAR(100),                  -- Ícone para card/button
  image TEXT,                         -- Imagem para card
  displayOrder INT DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

**Mudanças:**
- ❌ Remove: `priceModifier`, `timeModifier`, `weightModifier` (movem para vínculo)
- ✅ Mantém: Apenas valores (Fosca, Brilho, etc)

#### 3.3 Tabela: `productAttributes` (EXPANDIDA - NOVA ESTRUTURA)

**Antes:** Apenas metadados de vínculo  
**Depois:** Vínculo + Precificação + Regras

```sql
CREATE TABLE productAttributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productId INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attributeId INT NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  
  -- Configuração do vínculo
  isRequired BOOLEAN DEFAULT true,
  allowMultiple BOOLEAN DEFAULT false,
  displayOrder INT DEFAULT 0,
  
  -- ✨ NOVO: Precificação no vínculo (não no atributo global!)
  priceModifier DECIMAL(10,2) DEFAULT 0,        -- +R$15 para este produto
  calculationType ENUM('fixed', 'percentage', 'multiplier', 'per_sqm', 'per_quantity') DEFAULT 'fixed',
  timeModifier INT DEFAULT 0,                   -- +2 horas
  weightModifier DECIMAL(10,4) DEFAULT 0,       -- +0.5kg
  
  -- ✨ NOVO: Controle de ativação
  isActive BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,                       -- Ordem de exibição
  
  -- ✨ NOVO: Regras inline (JSON para flexibilidade)
  rules JSON,                                   -- Regras específicas deste vínculo
  
  -- Auditoria
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  
  -- Índices para performance
  UNIQUE KEY unique_product_attribute (productId, attributeId),
  INDEX idx_product (productId),
  INDEX idx_attribute (attributeId)
);
```

**Mudanças Principais:**
- ✅ Adiciona: `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`
- ✅ Adiciona: `isActive`, `priority` (controle fino)
- ✅ Adiciona: `rules` (JSON para regras inline)
- ✨ **Resultado:** Precificação agora é POR PRODUTO, não global!

#### 3.4 Tabela: `productAttributeValues` (MANTÉM-SE)

Controla quais valores estão habilitados para cada vínculo:

```sql
CREATE TABLE productAttributeValues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productAttributeId INT NOT NULL REFERENCES productAttributes(id) ON DELETE CASCADE,
  attributeValueId INT NOT NULL REFERENCES attributeValues(id) ON DELETE CASCADE,
  
  -- ✨ NOVO: Preço pode variar por valor também!
  priceModifier DECIMAL(10,2),                  -- Se NULL, usa do productAttributes
  calculationType ENUM('fixed', 'percentage', 'multiplier', 'per_sqm', 'per_quantity'),
  
  isEnabled BOOLEAN DEFAULT true,
  displayOrder INT DEFAULT 0,
  
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  
  UNIQUE KEY unique_product_attr_value (productAttributeId, attributeValueId),
  INDEX idx_product_attribute (productAttributeId)
);
```

**Mudanças:**
- ✅ Adiciona: `priceModifier`, `calculationType` (permite override por valor)
- ✨ **Resultado:** Granularidade máxima: Produto + Atributo + Valor

---

## 4. Exemplo Prático: Laminação Fosca

### Cenário

Mesmo atributo "Laminação Fosca" com preços diferentes por produto:

```
Laminação Fosca (Atributo Global)
├─ Cartão de Visita
│  └─ +R$15 (fixo)
├─ Folder
│  └─ +R$40 (fixo)
└─ Catálogo
   └─ +R$120 (fixo)
```

### Dados no Banco (Novo Schema)

**Tabela: attributes**
```
id=5, name="Laminação Fosca", type="select", icon="sparkles"
```

**Tabela: attributeValues**
```
id=51, attributeId=5, value="Fosca"
id=52, attributeId=5, value="Brilho"
```

**Tabela: productAttributes** (NOVO CONCEITO)
```
-- Cartão de Visita
id=101, productId=1, attributeId=5, priceModifier=15, calculationType="fixed", isActive=true

-- Folder
id=102, productId=2, attributeId=5, priceModifier=40, calculationType="fixed", isActive=true

-- Catálogo
id=103, productId=3, attributeId=5, priceModifier=120, calculationType="fixed", isActive=true
```

**Tabela: productAttributeValues**
```
-- Cartão de Visita - Fosca
id=201, productAttributeId=101, attributeValueId=51, isEnabled=true

-- Folder - Fosca
id=202, productAttributeId=102, attributeValueId=51, isEnabled=true

-- Catálogo - Fosca
id=203, productAttributeId=103, attributeValueId=51, isEnabled=true
```

### Cálculo de Preço (Novo Fluxo)

```typescript
// Antes (ERRADO - usava atributo global)
const priceModifier = attributeValue.priceModifier;  // Sempre R$15!

// Depois (CORRETO - usa vínculo do produto)
const productAttribute = await db
  .select()
  .from(productAttributes)
  .where(
    and(
      eq(productAttributes.productId, productId),
      eq(productAttributes.attributeId, attributeId)
    )
  );

const priceModifier = productAttribute.priceModifier;  // R$15, R$40 ou R$120!
```

---

## 5. Fluxo de Usuário (UI/UX)

### Antes (Confuso)

```
1. Ir para /admin/atributos
   └─ Criar "Laminação Fosca"
   └─ Criar valor "Fosca" com preço R$15

2. Ir para /admin/vincular-atributos
   └─ Selecionar Cartão
   └─ Vincular "Laminação Fosca"
   └─ Salvar (sem preço!)

3. Ir para /admin/precos-atributos
   └─ Selecionar "Laminação Fosca"
   └─ Editar preço para R$15
   └─ Salvar

4. REPETIR para Folder e Catálogo
   └─ 3 telas × 3 produtos = 9 navegações!
```

### Depois (Centralizado)

```
1. Ir para /admin/vincular-atributos
   └─ Selecionar Cartão
   └─ Listar atributos disponíveis
   └─ ☑ Laminação Fosca [R$ 15,00] [fixo] [ativo]
   └─ Salvar

2. Selecionar Folder
   └─ ☑ Laminação Fosca [R$ 40,00] [fixo] [ativo]
   └─ Salvar

3. Selecionar Catálogo
   └─ ☑ Laminação Fosca [R$ 120,00] [fixo] [ativo]
   └─ Salvar

✅ 1 tela, 3 produtos, 3 cliques!
```

---

## 6. Interface Proposta

### Layout de /admin/vincular-atributos (Novo)

```
┌─────────────────────────────────────────────────────────┐
│ Gerenciar Atributos do Produto                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Selecionar Produto: [Cartão de Visita ▼]              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Atributos Disponíveis                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ☑ Material                                              │
│   Valor: [R$ 0,00]  Tipo: [fixo ▼]                    │
│   Prazo: [0h]  Peso: [0kg]  Prioridade: [0]           │
│   Ativo: ☑  Regras: [+]                                │
│                                                         │
│ ☑ Acabamento                                            │
│   Valor: [R$ 15,00]  Tipo: [fixo ▼]                   │
│   Prazo: [2h]  Peso: [0kg]  Prioridade: [1]           │
│   Ativo: ☑  Regras: [+]                                │
│                                                         │
│ ☐ Formato                                               │
│   Valor: [R$ 0,00]  Tipo: [fixo ▼]                    │
│   Prazo: [0h]  Peso: [0kg]  Prioridade: [2]           │
│   Ativo: ☑  Regras: [+]                                │
│                                                         │
│ ☐ Cores                                                 │
│   Valor: [R$ 0,00]  Tipo: [fixo ▼]                    │
│   Prazo: [0h]  Peso: [0kg]  Prioridade: [3]           │
│   Ativo: ☑  Regras: [+]                                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                          [Cancelar]  [Salvar]           │
└─────────────────────────────────────────────────────────┘
```

**Componentes:**
- Seletor de produto (dropdown)
- Grid de atributos com checkboxes
- Campos inline para cada atributo:
  - Valor (R$)
  - Tipo de cálculo
  - Impacto prazo
  - Impacto peso
  - Prioridade
  - Ativo/Inativo
  - Botão para adicionar regras

---

## 7. Migrações Necessárias

### Passo 1: Criar Novas Colunas em `productAttributes`

```sql
ALTER TABLE productAttributes ADD COLUMN (
  priceModifier DECIMAL(10,2) DEFAULT 0,
  calculationType ENUM('fixed', 'percentage', 'multiplier', 'per_sqm', 'per_quantity') DEFAULT 'fixed',
  timeModifier INT DEFAULT 0,
  weightModifier DECIMAL(10,4) DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  rules JSON
);
```

### Passo 2: Migrar Dados de `attributeValues` → `productAttributes`

```sql
-- Para cada vínculo, copiar os valores do atributo global
UPDATE productAttributes pa
SET pa.priceModifier = (
  SELECT av.priceModifier
  FROM attributeValues av
  WHERE av.attributeId = pa.attributeId
  LIMIT 1
)
WHERE pa.priceModifier = 0;
```

### Passo 3: Remover Colunas de `attributeValues`

```sql
ALTER TABLE attributeValues DROP COLUMN priceModifier;
ALTER TABLE attributeValues DROP COLUMN timeModifier;
ALTER TABLE attributeValues DROP COLUMN weightModifier;
```

### Passo 4: Adicionar Colunas a `productAttributeValues` (Opcional)

```sql
ALTER TABLE productAttributeValues ADD COLUMN (
  priceModifier DECIMAL(10,2),
  calculationType ENUM('fixed', 'percentage', 'multiplier', 'per_sqm', 'per_quantity')
);
```

---

## 8. Impacto em Outras Partes do Sistema

### Cálculo de Preço (server/pricing.ts)

**Antes:**
```typescript
const attrValue = await db.select().from(attributeValues).where(eq(attributeValues.id, selectedValueId));
const priceModifier = attrValue.priceModifier;  // ❌ Global
```

**Depois:**
```typescript
const productAttr = await db.select().from(productAttributes)
  .where(and(
    eq(productAttributes.productId, productId),
    eq(productAttributes.attributeId, attributeId)
  ));
const priceModifier = productAttr.priceModifier;  // ✅ Por produto
```

### Renderização de Produto (Frontend)

**Antes:**
```typescript
const attributes = await trpc.attributes.getProductAttributes.useQuery(productId);
// Retornava valores globais
```

**Depois:**
```typescript
const attributes = await trpc.attributes.getProductAttributes.useQuery(productId);
// Retorna vínculo + precificação específica do produto
```

### Eliminar `/admin/precos-atributos`

- ❌ Remover rota
- ❌ Remover componente
- ❌ Remover procedures tRPC
- ✅ Funcionalidade integrada em `/admin/vincular-atributos`

---

## 9. Benefícios Finais

| Benefício | Descrição |
|-----------|-----------|
| **Centralização** | Tudo em uma tela |
| **Contexto** | Admin vê produto + atributos juntos |
| **Precisão** | Preços por produto, não globais |
| **Escalabilidade** | Suporta múltiplos tipos de cálculo |
| **Consistência** | Sem risco de desincronização |
| **Performance** | Menos queries, menos navegação |
| **UX** | Fluxo intuitivo e profissional |
| **Manutenibilidade** | Código mais limpo e testável |

---

## 10. Próximos Passos (Após Aprovação)

1. ✅ **Validar arquitetura com usuário** (ESTA FASE)
2. ⏳ Criar migrations SQL
3. ⏳ Atualizar schema Drizzle
4. ⏳ Refatorar `/admin/vincular-atributos`
5. ⏳ Eliminar `/admin/precos-atributos`
6. ⏳ Atualizar procedures tRPC
7. ⏳ Testes e validação

---

## Conclusão

Esta arquitetura centraliza toda a precificação no vínculo **produto ↔ atributo**, eliminando redundância e complexidade. O resultado é um sistema mais profissional, escalável e intuitivo.

**Aguardando aprovação para prosseguir com implementação.**
