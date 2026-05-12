# 📚 Documentação Final - Sistema Dinâmico de Gráfica Online

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Sistema de Atributos Dinâmicos](#sistema-de-atributos-dinâmicos)
5. [Regras Condicionais](#regras-condicionais)
6. [Cálculo Dinâmico de Preços](#cálculo-dinâmico-de-preços)
7. [Banco de Dados](#banco-de-dados)
8. [Frontend - Renderização Automática](#frontend---renderização-automática)
9. [Admin - Painel de Controle](#admin---painel-de-controle)
10. [Fluxo de Compra](#fluxo-de-compra)
11. [Testes e Validação](#testes-e-validação)
12. [Guia de Uso](#guia-de-uso)

---

## Visão Geral

O **Sistema Dinâmico de Gráfica Online** é uma plataforma profissional de e-commerce e ERP para empresas gráficas. A arquitetura é 100% dinâmica e baseada em metadados, eliminando a necessidade de programação manual para adicionar novos produtos.

### Características Principais

- **Sem Hardcode**: Todos os produtos são renderizados dinamicamente
- **Atributos Reutilizáveis**: Crie atributos globais uma vez, use em múltiplos produtos
- **Regras Condicionais**: Automatize lógica comercial (mostrar/ocultar, alterar preço, etc)
- **Preços Dinâmicos**: Cálculo automático baseado em atributos selecionados
- **Multi-Segmento**: Produtos podem pertencer a múltiplos segmentos de negócio
- **ERP Integrado**: CRM, Financeiro, Web2Print, Automação

---

## Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  UniversalProductRenderer.tsx                        │   │
│  │  - Renderiza qualquer produto dinamicamente          │   │
│  │  - Carrega atributos do banco de dados              │   │
│  │  - Aplica regras condicionais em tempo real         │   │
│  │  - Calcula preço automaticamente                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    tRPC (Express 4)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Procedures:                                         │   │
│  │  - products.getById (com atributos)                 │   │
│  │  - pricing.calculatePrice                          │   │
│  │  - attributes.* (CRUD)                             │   │
│  │  - rules.* (CRUD)                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (MySQL/TiDB)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tabelas:                                            │   │
│  │  - attributes (globais reutilizáveis)              │   │
│  │  - attributeValues (valores dos atributos)         │   │
│  │  - productAttributes (vinculação)                  │   │
│  │  - attributeRules (regras condicionais)            │   │
│  │  - products (dados básicos)                        │   │
│  │  - orders, orderItems (pedidos)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados

### Fluxo Completo: Produto → Carrinho → Pedido

```
1. CLIENTE ACESSA PRODUTO
   └─> Frontend carrega ProductDetail
       └─> tRPC: products.getById(productId)
           └─> BD: Carrega produto com atributos vinculados
               └─> Frontend: UniversalProductRenderer renderiza UI

2. CLIENTE SELECIONA ATRIBUTOS
   └─> Frontend aplica regras condicionais
       └─> Atributos mostram/ocultam dinamicamente
       └─> Preço recalcula em tempo real

3. CLIENTE FAZ UPLOAD DE ARQUIVO
   └─> Validação de arquivo (DPI, tamanho, formato)
   └─> Armazenamento em S3

4. CLIENTE ADICIONA AO CARRINHO
   └─> Frontend cria CartItem com:
       - productId
       - selectedAttributes (Map)
       - quantity
       - totalPrice
       - uploadedFiles

5. CLIENTE FINALIZA COMPRA
   └─> tRPC: orders.create(cartItems)
       └─> BD: Cria Order e OrderItems
           └─> BD: Cria OrderItemAttributes (atributos selecionados)
               └─> Retorna Order com ID

6. CLIENTE REABRE PEDIDO
   └─> tRPC: orders.getById(orderId)
       └─> BD: Carrega Order com OrderItems e atributos
           └─> Frontend: Exibe dados completos
```

---

## Sistema de Atributos Dinâmicos

### Conceito

Um **atributo** é uma característica de produto reutilizável. Exemplos:

- Material (Couchê, Supremo, Lona, Vinil)
- Acabamento (Laminação, Verniz, Refile)
- Formato (A4, A5, Personalizado)
- Cores de Impressão (4x0, 4x4, etc)

### Tabelas Relacionadas

#### 1. `attributes` - Definição Global

```sql
CREATE TABLE attributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE,      -- "Material"
  slug VARCHAR(255) UNIQUE,      -- "material"
  type ENUM('select', 'button', 'card', 'numeric', ...),
  icon VARCHAR(100),             -- Ícone para UI
  displayOrder INT,
  isActive BOOLEAN
);
```

#### 2. `attributeValues` - Valores Possíveis

```sql
CREATE TABLE attributeValues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attributeId INT REFERENCES attributes(id),
  value VARCHAR(255),            -- "Couchê 300g"
  priceModifier DECIMAL(10,2),   -- +10 reais
  timeModifier INT,              -- +2 horas
  weightModifier DECIMAL(10,4),  -- +0.5 kg
  image TEXT,                    -- URL da imagem
  isActive BOOLEAN
);
```

#### 3. `productAttributes` - Vinculação

```sql
CREATE TABLE productAttributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productId INT REFERENCES products(id),
  attributeId INT REFERENCES attributes(id),
  isRequired BOOLEAN,            -- Obrigatório?
  allowMultiple BOOLEAN,         -- Múltiplas seleções?
  displayOrder INT
);
```

#### 4. `productAttributeValues` - Valores Disponíveis

```sql
CREATE TABLE productAttributeValues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productAttributeId INT REFERENCES productAttributes(id),
  attributeValueId INT REFERENCES attributeValues(id),
  isEnabled BOOLEAN              -- Ativar/desativar valor
);
```

### Exemplo: Cartão de Visita

```
Produto: Cartão de Visita (ID: 1)
├─ Atributo: Material (obrigatório, seleção única)
│  ├─ Couchê 300g (preço +0)
│  ├─ Supremo 250g (preço +10)
│  └─ Couchê 250g (preço +5)
├─ Atributo: Acabamento (opcional, múltiplas seleções)
│  ├─ Laminação Fosca (preço +15)
│  ├─ Laminação Brilho (preço +20)
│  └─ Verniz UV (preço +25)
└─ Atributo: Formato (obrigatório, seleção única)
   ├─ 9x5cm (preço +0)
   └─ 10x5cm (preço +2)
```

---

## Regras Condicionais

### Conceito

**Regras** automatizam lógica comercial baseada em seleções do cliente.

### Tipos de Ações

| Ação | Descrição | Exemplo |
|------|-----------|---------|
| `show` | Mostrar atributo | Se Material=Lona, mostrar Ilhós |
| `hide` | Ocultar atributo | Se Material=Couchê, ocultar Bastão |
| `enable` | Habilitar atributo | Se Material=Couchê, habilitar Laminação |
| `disable` | Desabilitar atributo | Se Material=Lona, desabilitar Laminação |
| `setPrice` | Definir preço fixo | Se Acabamento=Verniz, preço=25 |
| `addPrice` | Adicionar ao preço | Se Material=Lona, +50 reais |

### Tabelas Relacionadas

#### 1. `attributeRules` - Definição da Regra

```sql
CREATE TABLE attributeRules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productId INT REFERENCES products(id),
  name VARCHAR(255),             -- "Lona requer ilhós"
  description LONGTEXT,
  isActive BOOLEAN
);
```

#### 2. `attributeRuleConditions` - Condições

```sql
CREATE TABLE attributeRuleConditions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ruleId INT REFERENCES attributeRules(id),
  attributeId INT REFERENCES attributes(id),
  operator ENUM('equals', 'contains', 'greaterThan', 'lessThan', 'in'),
  value VARCHAR(255)             -- Valor a comparar
);
```

#### 3. `attributeRuleActions` - Ações

```sql
CREATE TABLE attributeRuleActions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ruleId INT REFERENCES attributeRules(id),
  targetAttributeId INT REFERENCES attributes(id),
  action ENUM('show', 'hide', 'enable', 'disable', 'setPrice', 'addPrice'),
  value VARCHAR(255)             -- Valor para ação (ex: preço)
);
```

### Exemplo: Regras para Banner com Lona

```
Regra 1: "Lona requer ilhós"
├─ Condição: Material = "Lona"
└─ Ações:
   ├─ Mostrar Ilhós
   └─ Mostrar Bastão

Regra 2: "Lona não permite laminação"
├─ Condição: Material = "Lona"
└─ Ação: Desabilitar Laminação

Regra 3: "Lona tem custo adicional"
├─ Condição: Material = "Lona"
└─ Ação: Adicionar +50 reais ao preço
```

---

## Cálculo Dinâmico de Preços

### Fórmula de Cálculo

```
Preço Final = Preço Base
            + Σ(Modificadores de Atributos)
            + Σ(Modificadores de Regras)
            - Desconto por Volume
            + Impostos
```

### Exemplo Prático

```
Produto: Cartão de Visita
Preço Base: R$ 50

Cliente seleciona:
- Material: Couchê 300g (+0)
- Acabamento: Laminação Fosca (+15)
- Quantidade: 1000 unidades

Cálculo:
├─ Preço Base: R$ 50
├─ Material: +R$ 0
├─ Acabamento: +R$ 15
├─ Subtotal: R$ 65
├─ Desconto por Volume (1000 un): -R$ 6.50 (10%)
├─ Subtotal com Desconto: R$ 58.50
├─ Impostos (18%): +R$ 10.53
└─ TOTAL: R$ 69.03
```

### Modificadores de Atributos

Cada valor de atributo pode ter:

- **priceModifier**: Impacto no preço (ex: +15 reais)
- **timeModifier**: Impacto no prazo (ex: +2 horas)
- **weightModifier**: Impacto no peso (ex: +0.5 kg)

---

## Banco de Dados

### Tabelas Principais

#### 1. `products`

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  description LONGTEXT,
  price DECIMAL(10,2),
  segment ENUM('alimentacao', 'beleza', 'varejo', 'servicos'),
  imageUrl TEXT,
  imageKey VARCHAR(255),
  isActive BOOLEAN,
  requiresAreaCalculation BOOLEAN,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### 2. `orders`

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clientId INT REFERENCES users(id),
  orderNumber VARCHAR(50) UNIQUE,
  status ENUM('aguardando', 'em_producao', 'enviado', 'entregue'),
  totalPrice DECIMAL(10,2),
  artFileUrl TEXT,
  artFileKey VARCHAR(255),
  paymentStatus ENUM('pendente', 'pago', 'falhou'),
  notes LONGTEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### 3. `orderItems`

```sql
CREATE TABLE orderItems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT REFERENCES orders(id),
  productId INT REFERENCES products(id),
  quantity INT,
  pricePerUnit DECIMAL(10,2),
  totalPrice DECIMAL(10,2),
  customNotes LONGTEXT,
  createdAt TIMESTAMP
);
```

#### 4. `orderItemAttributes`

```sql
CREATE TABLE orderItemAttributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderItemId INT REFERENCES orderItems(id),
  attributeValueId INT REFERENCES attributeValues(id),
  customValue VARCHAR(255),     -- Para campos numéricos/texto
  createdAt TIMESTAMP
);
```

#### 5. `productSegments`

```sql
CREATE TABLE productSegments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productId INT REFERENCES products(id),
  segmentId INT REFERENCES segments(id),
  createdAt TIMESTAMP
);
```

---

## Frontend - Renderização Automática

### Componente: UniversalProductRenderer.tsx

O componente `UniversalProductRenderer` é o coração da renderização dinâmica.

#### Fluxo

```
1. Carrega dados do produto
   └─> tRPC: products.getById(productId)
       └─> Retorna: { id, name, price, attributes: [...] }

2. Carrega atributos vinculados
   └─> tRPC: attributes.getProductAttributes(productId)
       └─> Retorna: ProductAttribute[] com valores

3. Carrega regras condicionais
   └─> tRPC: rules.getProductRules(productId)
       └─> Retorna: AttributeRule[]

4. Renderiza UI dinamicamente
   └─> Para cada atributo:
       ├─ Cria componente DynamicAttributeRenderer
       ├─ Aplica regras (show/hide/enable/disable)
       └─ Renderiza controle apropriado (select, button, card, etc)

5. Calcula preço em tempo real
   └─> Ao selecionar atributo:
       ├─ tRPC: pricing.calculatePrice(...)
       └─ Atualiza preço na UI
```

#### Exemplo de Uso

```tsx
<UniversalProductRenderer
  productId={1}
  onAddToCart={(cartItem) => {
    // Adicionar ao carrinho
    console.log(cartItem);
  }}
/>
```

#### Dados Retornados

```typescript
interface CartItem {
  productId: number;
  quantity: number;
  selectedAttributes: Map<number, any>;
  totalPrice: number;
  uploadedFiles: UploadedFile[];
}
```

---

## Admin - Painel de Controle

### Páginas Admin

#### 1. AdminProducts.tsx - Gerenciar Produtos

**Funcionalidades:**
- Listar todos os produtos
- Buscar produtos por nome/descrição
- Editar produto (nome, preço, descrição)
- Adicionar/remover segmentos
- Deletar produto

**Fluxo:**
```
1. Carrega todos os produtos
   └─> tRPC: admin.getAllProducts()

2. Usuário busca produto
   └─> Filtra localmente

3. Usuário clica em "Editar"
   └─> Abre dialog com formulário

4. Usuário salva alterações
   └─> tRPC: admin.updateProduct(...)
   └─> tRPC: productSegments.updateSegments(...)
```

#### 2. AdminAttributesManager.tsx - Gerenciar Atributos

**Funcionalidades:**
- Criar novo atributo global
- Editar atributo (nome, tipo, ícone)
- Criar valores para atributo
- Editar valores (preço, prazo, peso)
- Desativar atributo/valor

**Fluxo:**
```
1. Usuário clica "Novo Atributo"
   └─> Abre formulário

2. Usuário preenche dados
   └─> Nome: "Material"
   └─> Tipo: "select"
   └─> Ícone: "package"

3. Usuário clica "Salvar"
   └─> tRPC: attributes.createAttribute(...)
   └─> Retorna ID do atributo

4. Usuário adiciona valores
   └─> Clica "Adicionar Valor"
   └─> Preenche: "Couchê 300g", preço +10
   └─> tRPC: attributes.createAttributeValue(...)
```

#### 3. AdminProductAttributesLinker.tsx - Vincular Atributos

**Funcionalidades:**
- Selecionar produto
- Vincular atributos globais ao produto
- Definir se atributo é obrigatório
- Definir se permite múltiplas seleções
- Desvinc ular atributo

**Fluxo:**
```
1. Usuário seleciona produto
   └─> Carrega atributos já vinculados

2. Usuário seleciona atributo global
   └─> Marca checkbox

3. Usuário clica "Vincular"
   └─> tRPC: attributes.linkAttributeToProduct(...)
   └─> productAttributes.isRequired = true
   └─> productAttributes.allowMultiple = false
```

#### 4. AdminRulesBuilder.tsx - Construir Regras

**Funcionalidades:**
- Selecionar produto
- Criar nova regra
- Adicionar condições (IF)
- Adicionar ações (THEN)
- Editar/deletar regras

**Fluxo:**
```
1. Usuário seleciona produto
   └─> Carrega regras existentes

2. Usuário clica "Nova Regra"
   └─> Abre builder

3. Usuário adiciona condição
   └─> IF: Material = "Lona"

4. Usuário adiciona ação
   └─> THEN: Mostrar Ilhós
   └─> THEN: Adicionar +50 ao preço

5. Usuário clica "Salvar"
   └─> tRPC: rules.createRule(...)
```

---

## Fluxo de Compra

### Passo a Passo

#### 1. Cliente Acessa Produto

```
URL: /produtos/1
└─> Frontend carrega UniversalProductRenderer
    └─> Renderiza UI com atributos
    └─> Exibe preço base
```

#### 2. Cliente Seleciona Atributos

```
Cliente seleciona:
├─ Material: "Couchê 300g"
├─ Acabamento: "Laminação Fosca"
└─ Formato: "A5"

Frontend:
├─ Aplica regras condicionais
├─ Atualiza visibilidade/habilitação de atributos
└─ Calcula preço em tempo real
    └─ tRPC: pricing.calculatePrice(...)
```

#### 3. Cliente Faz Upload

```
Cliente clica "Upload de Arquivo"
└─> Seleciona arquivo PDF

Frontend:
├─ Valida arquivo
│  ├─ Extensão: PDF, PNG, JPG
│  ├─ Tamanho: ≤ 10MB
│  ├─ DPI: ≥ 300
│  └─ Modo de cor: CMYK
└─ Upload para S3
   └─ Retorna URL e chave
```

#### 4. Cliente Adiciona ao Carrinho

```
Cliente clica "Adicionar ao Carrinho"
└─> Frontend cria CartItem:
    {
      productId: 1,
      quantity: 1000,
      selectedAttributes: Map([[1, 101], [2, 201]]),
      totalPrice: 69.03,
      uploadedFiles: [{ id: "file1", name: "design.pdf", ... }]
    }

Frontend:
├─ Salva no localStorage (persistência)
└─ Redireciona para carrinho
```

#### 5. Cliente Finaliza Compra

```
Cliente clica "Finalizar Compra"
└─> Frontend envia:
    {
      items: [CartItem],
      paymentMethod: "credit_card"
    }

Backend:
├─ tRPC: orders.create(...)
├─ Cria Order
├─ Cria OrderItems
├─ Cria OrderItemAttributes
└─ Retorna Order com ID

Frontend:
├─ Exibe confirmação
└─ Redireciona para pedido
```

#### 6. Cliente Reabre Pedido

```
URL: /pedidos/ORD-001
└─> Frontend carrega pedido:
    {
      id: "ORD-001",
      items: [
        {
          productId: 1,
          quantity: 1000,
          selectedAttributes: Map([[1, 101], [2, 201]]),
          totalPrice: 69.03
        }
      ],
      status: "pending"
    }

Frontend:
├─ Exibe dados completos
├─ Permite edição se status = "pending"
└─ Permite visualização se status ≠ "pending"
```

---

## Testes e Validação

### Suites de Testes Criadas

#### 1. `pricing-calculations.test.ts`
- ✅ 40+ testes de cálculo de preço
- ✅ Validação de modificadores
- ✅ Desconto por volume
- ✅ Cálculo de impostos
- ✅ Cálculo de prazo

#### 2. `integration-flow.test.ts`
- ✅ 18+ testes de fluxo completo
- ✅ Seleção de produto
- ✅ Adição ao carrinho
- ✅ Upload de arquivo
- ✅ Criação de pedido
- ✅ Persistência

#### 3. `conditional-rules.test.ts`
- ✅ 27+ testes de regras condicionais
- ✅ Mostrar/ocultar atributos
- ✅ Habilitar/desabilitar
- ✅ Alterar preço
- ✅ Dependências entre atributos

#### 4. `persistence.test.ts`
- ✅ 22+ testes de persistência
- ✅ Salvamento de produtos
- ✅ Persistência de atributos
- ✅ Persistência de segmentos
- ✅ Persistência do carrinho
- ✅ Persistência de pedidos

#### 5. `admin-functionality.test.ts`
- ✅ 36+ testes do admin
- ✅ Criação de produtos
- ✅ Edição de produtos
- ✅ Múltiplos segmentos
- ✅ Atributos globais
- ✅ Regras condicionais
- ✅ Busca de produtos

### Executar Testes

```bash
# Todos os testes
pnpm test

# Teste específico
pnpm test -- pricing-calculations.test.ts

# Com cobertura
pnpm test -- --coverage
```

---

## Guia de Uso

### Como Criar um Novo Produto

#### Passo 1: Criar Atributos Globais

1. Acesse `/admin/atributos`
2. Clique "Novo Atributo"
3. Preencha:
   - Nome: "Material"
   - Tipo: "select"
   - Ícone: "package"
4. Clique "Salvar"
5. Adicione valores:
   - "Couchê 300g" (preço +0)
   - "Supremo 250g" (preço +10)

#### Passo 2: Criar Produto

1. Acesse `/admin/produtos`
2. Clique "Novo Produto"
3. Preencha:
   - Nome: "Cartão de Visita"
   - Preço: 50
   - Descrição: "Cartão profissional"
4. Clique "Salvar"

#### Passo 3: Vincular Atributos

1. Acesse `/admin/vincular-atributos`
2. Selecione produto: "Cartão de Visita"
3. Selecione atributo: "Material"
4. Marque "Obrigatório"
5. Clique "Vincular"

#### Passo 4: Adicionar Segmentos

1. Acesse `/admin/produtos`
2. Edite "Cartão de Visita"
3. Selecione segmentos: "Varejo", "Serviços"
4. Clique "Salvar"

#### Passo 5: Criar Regras (Opcional)

1. Acesse `/admin/regras`
2. Selecione produto: "Cartão de Visita"
3. Clique "Nova Regra"
4. Adicione condição: "Material = Couchê"
5. Adicione ação: "Habilitar Laminação"
6. Clique "Salvar"

### Como Editar Preços de Atributos

1. Acesse `/admin/atributos`
2. Selecione atributo: "Material"
3. Clique em valor: "Supremo 250g"
4. Edite preço: +15 (era +10)
5. Clique "Salvar"

**Resultado:** Todos os produtos que usam "Supremo 250g" terão preço atualizado automaticamente!

### Como Criar Regra Condicional

1. Acesse `/admin/regras`
2. Selecione produto
3. Clique "Nova Regra"
4. Preencha:
   - Nome: "Lona requer ilhós"
   - Condição: "Material = Lona"
   - Ação: "Mostrar Ilhós"
5. Clique "Salvar"

**Resultado:** Quando cliente selecionar "Lona", atributo "Ilhós" aparecerá automaticamente!

---

## Resumo da Arquitetura

### Princípios

1. **Sem Hardcode**: Tudo é dinâmico
2. **Reutilizável**: Atributos globais, múltiplos produtos
3. **Escalável**: Adicione produtos sem programação
4. **Testado**: 100+ testes automatizados
5. **Profissional**: ERP integrado

### Fluxo de Dados

```
Admin cria Atributos Globais
    ↓
Admin cria Produto
    ↓
Admin vincula Atributos ao Produto
    ↓
Admin cria Regras Condicionais
    ↓
Cliente acessa Produto
    ↓
Frontend renderiza UI dinamicamente
    ↓
Cliente seleciona Atributos
    ↓
Frontend aplica Regras e calcula Preço
    ↓
Cliente faz Upload e adiciona ao Carrinho
    ↓
Cliente finaliza Compra
    ↓
Sistema cria Pedido com Atributos
    ↓
Cliente pode reabrir Pedido com dados intactos
```

---

## Suporte

Para dúvidas ou problemas:

1. Consulte a documentação de testes
2. Verifique os logs do servidor
3. Valide dados no banco de dados
4. Execute testes específicos

---

**Versão:** 1.0  
**Data:** Maio 2026  
**Status:** Produção Pronta
