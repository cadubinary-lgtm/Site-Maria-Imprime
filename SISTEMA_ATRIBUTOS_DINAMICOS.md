# 📦 Sistema de Atributos Dinâmicos - Documentação Completa

## 🎯 Visão Geral

O **Sistema de Atributos Dinâmicos** permite criar produtos configuráveis sem necessidade de programação manual. Tudo é controlado pelo painel admin através de interfaces intuitivas.

---

## 🏗️ Arquitetura

### Tabelas do Banco de Dados

```
attributes                    → Atributos globais (Material, Acabamento, etc)
attributeValues              → Valores possíveis (Couchê 90g, Lona 280g, etc)
productAttributes            → Vinculação produto-atributo
productAttributeValues       → Valores habilitados por produto
attributeRules               → Regras condicionais
attributeRuleConditions      → Condições das regras
attributeRuleActions         → Ações das regras
orderItemAttributes          → Atributos selecionados no pedido
```

### Fluxo de Dados

```
1. Admin cadastra Atributos Globais
   ↓
2. Admin vincula Atributos a Produtos
   ↓
3. Admin cria Regras Condicionais (opcional)
   ↓
4. Frontend carrega Atributos do Produto
   ↓
5. Renderizador Dinâmico cria Componentes
   ↓
6. Cliente seleciona Opções
   ↓
7. Regras são avaliadas em tempo real
   ↓
8. Preço e Prazo são atualizados automaticamente
```

---

## 🎮 Como Usar

### Passo 1: Criar Atributos Globais

Acesse: `/admin/atributos`

1. Clique em "Novo Atributo"
2. Preencha:
   - **Nome**: Ex: "Material", "Acabamento", "Cor"
   - **Slug**: Ex: "material", "acabamento", "cor"
   - **Tipo**: Escolha como aparecerá no frontend
     - `button` - Botões lado a lado
     - `select` - Dropdown
     - `card` - Cards com imagem
     - `radio` - Radio buttons
     - `checkbox` - Checkboxes (múltiplas seleções)
     - `numeric` - Campo numérico
     - `text` - Campo de texto
     - `measures` - Medidas personalizadas

3. Clique em "Salvar"

### Passo 2: Adicionar Valores ao Atributo

Após criar o atributo, adicione seus valores:

**Exemplo - Atributo "Material":**
- Couchê 90g (preço: +0.00, tempo: 0h)
- Couchê 115g (preço: +0.50, tempo: 0h)
- Lona 280g (preço: +2.00, tempo: 2h)
- Vinil Brilho (preço: +1.50, tempo: 1h)

### Passo 3: Vincular Atributos a Produtos

Acesse: `/admin/vincular-atributos`

1. Selecione um produto na coluna esquerda
2. Marque os atributos que este produto usa
3. Clique em "Vincular X Atributo(s)"

**Exemplo - Cartão de Visita:**
- ✓ Material
- ✓ Acabamento
- ✓ Laminação
- ✓ Quantidade

**Exemplo - Banner:**
- ✓ Material
- ✓ Medidas Livres
- ✓ Ilhós
- ✓ Bastão

### Passo 4: Criar Regras Condicionais (Opcional)

Acesse: `/admin/regras`

Regras permitem que certos atributos apareçam ou desapareçam baseado em seleções anteriores.

**Exemplo 1 - Lona com Ilhós:**
```
CONDIÇÃO: Se Material = "Lona 280g"
AÇÃO: Mostrar "Ilhós"
```

**Exemplo 2 - Acabamento limitado:**
```
CONDIÇÃO: Se Material = "Couchê 90g"
AÇÃO: Ocultar "Laminação Fosca"
```

**Exemplo 3 - Modificador de preço:**
```
CONDIÇÃO: Se Acabamento = "Verniz UV"
AÇÃO: Adicionar +5.00 ao preço
```

---

## 🎨 Tipos de Componentes

### 1. Button (Botões)
Ideal para: Cores, acabamentos simples
```
[Preto] [Branco] [Azul] [Vermelho]
```

### 2. Select (Dropdown)
Ideal para: Listas longas de opções
```
▼ Selecione o material
  - Couchê 90g
  - Couchê 115g
  - Lona 280g
```

### 3. Card (Cards com Imagem)
Ideal para: Materiais com visual
```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Imagem  │ │ Imagem  │ │ Imagem  │
│ Couchê  │ │  Lona   │ │  Vinil  │
└─────────┘ └─────────┘ └─────────┘
```

### 4. Radio (Radio Buttons)
Ideal para: Seleção única obrigatória
```
⦿ Corte Reto
○ Cantos Arredondados
○ Corte Especial
```

### 5. Checkbox (Checkboxes)
Ideal para: Múltiplas seleções
```
☑ Laminação Fosca
☐ Laminação Brilho
☑ Verniz UV
```

### 6. Numeric (Campo Numérico)
Ideal para: Quantidades, medidas
```
Quantidade: [1000] unidades
```

### 7. Text (Campo de Texto)
Ideal para: Texto livre
```
Mensagem personalizada: [_________________]
```

### 8. Measures (Medidas Personalizadas)
Ideal para: Medidas livres
```
Largura: [100] cm
Altura: [50] cm
```

---

## 💰 Modificadores de Preço

Cada valor de atributo pode ter modificadores:

| Atributo | Valor | Preço Base | Modificador | Preço Final |
|----------|-------|-----------|-------------|------------|
| Material | Couchê 90g | R$ 10.00 | +0.00 | R$ 10.00 |
| Material | Couchê 115g | R$ 10.00 | +0.50 | R$ 10.50 |
| Material | Lona 280g | R$ 10.00 | +2.00 | R$ 12.00 |
| Acabamento | Laminação Fosca | R$ 10.00 | +1.00 | R$ 11.00 |
| Acabamento | Verniz UV | R$ 10.00 | +5.00 | R$ 15.00 |

---

## ⏱️ Modificadores de Prazo

Cada valor também pode alterar o prazo de entrega:

| Atributo | Valor | Prazo Base | Modificador | Prazo Final |
|----------|-------|-----------|-------------|------------|
| Material | Couchê 90g | 3 dias | +0 | 3 dias |
| Material | Lona 280g | 3 dias | +2 | 5 dias |
| Acabamento | Verniz UV | 3 dias | +1 | 4 dias |

---

## 🔄 Fluxo de Renderização no Frontend

### ProductDetail.tsx

```typescript
1. Carrega produto
2. Busca atributos vinculados via tRPC
3. Para cada atributo:
   - Determina tipo de componente
   - Renderiza DynamicAttributeRenderer
4. Ao selecionar opção:
   - Avalia regras condicionais
   - Atualiza visibilidade/estado
   - Recalcula preço e prazo
5. Exibe resumo com valores finais
```

### DynamicAttributeRenderer.tsx

Componente universal que renderiza qualquer tipo de atributo:

```typescript
interface DynamicAttributeProps {
  attribute: Attribute
  type: "button" | "select" | "card" | "radio" | "checkbox" | "numeric" | "text" | "measures"
  values: AttributeValue[]
  onSelect: (value: AttributeValue) => void
  disabled?: boolean
  required?: boolean
}
```

---

## 🚀 Exemplos Práticos

### Exemplo 1: Cartão de Visita Simples

**Atributos:**
- Material: Couchê 90g, Couchê 115g, Couchê 250g
- Acabamento: Sem acabamento, Laminação Fosca, Laminação Brilho
- Quantidade: 500, 1000, 2000, 5000

**Sem Regras:** Todas as combinações são válidas

**Renderização:**
```
Material:
[Couchê 90g] [Couchê 115g] [Couchê 250g]

Acabamento:
▼ Selecione o acabamento

Quantidade:
⦿ 500 unidades
○ 1000 unidades
○ 2000 unidades
○ 5000 unidades

Preço: R$ 45.00
Prazo: 3 dias úteis
```

### Exemplo 2: Banner com Regras

**Atributos:**
- Material: Lona 280g, Lona 440g
- Acabamento: Ilhós, Bastão, Ambos
- Medidas: Livres

**Regras:**
```
Regra 1: Se Material = Lona 280g → Ocultar "Bastão"
Regra 2: Se Material = Lona 440g → Mostrar "Bastão"
Regra 3: Se Acabamento = Bastão → Adicionar +10.00
```

**Renderização:**
```
Material:
[Lona 280g] [Lona 440g]

Acabamento: (depende da seleção anterior)
Se Lona 280g: [Ilhós] [Ambos]
Se Lona 440g: [Ilhós] [Bastão] [Ambos]

Medidas:
Largura: [_____] cm
Altura: [_____] cm

Preço: R$ 85.00 - R$ 95.00 (depende de seleções)
Prazo: 5-7 dias úteis
```

### Exemplo 3: Comunicação Visual com Medidas Livres

**Atributos:**
- Tipo: Lona, Vinil, Adesivo
- Acabamento: Corte Reto, Cantos Arredondados
- Medidas: Livres
- Revestimento: Brilho, Fosco, Metalizado

**Regras:**
```
Regra 1: Se Tipo = Adesivo → Ocultar "Revestimento"
Regra 2: Se Medidas > 2m² → Adicionar +0.50 por m²
Regra 3: Se Revestimento = Metalizado → Adicionar +5.00
```

---

## 📊 Painel Admin - Visão Geral

### Dashboard Principal (`/admin/erp`)
- Acesso rápido a todos os módulos
- KPIs principais

### Gerenciar Atributos (`/admin/atributos`)
- CRUD de atributos globais
- Seleção de tipo de componente
- Descrição e slug

### Vincular Atributos (`/admin/vincular-atributos`)
- Seleção de produto
- Seleção de múltiplos atributos
- Visualização de atributos já vinculados

### Construtor de Regras (`/admin/regras`)
- Interface visual para criar regras
- Condições com operadores lógicos
- Ações com modificadores de preço/prazo

---

## ✅ Checklist de Implementação

### Para cada novo produto:

- [ ] Identificar atributos necessários
- [ ] Verificar se atributos já existem globalmente
- [ ] Se não existem, criar em `/admin/atributos`
- [ ] Ir para `/admin/vincular-atributos`
- [ ] Selecionar produto
- [ ] Marcar atributos necessários
- [ ] Vincular
- [ ] Se necessário, criar regras em `/admin/regras`
- [ ] Testar no frontend
- [ ] Produto pronto para venda!

---

## 🔧 Troubleshooting

### Atributo não aparece no produto

1. Verifique se o atributo foi criado em `/admin/atributos`
2. Verifique se foi vinculado em `/admin/vincular-atributos`
3. Recarregue a página do produto

### Preço não atualiza

1. Verifique se os modificadores foram configurados
2. Verifique se as regras estão ativas
3. Abra o console do navegador para ver erros

### Regra não funciona

1. Verifique as condições (operador e valor)
2. Verifique se a regra está ativa
3. Teste com valores exatos

---

## 📈 Próximas Melhorias

- [ ] Pré-visualização de regras antes de publicar
- [ ] Validação de combinações inválidas
- [ ] Sugestões automáticas de atributos
- [ ] Histórico de mudanças
- [ ] Testes A/B de atributos
- [ ] Analytics de atributos mais usados

---

## 📞 Suporte

Para dúvidas sobre o sistema de atributos dinâmicos, consulte:
- Documentação técnica: `ERP_ARCHITECTURE.md`
- Testes: `server/erp-integration.test.ts`
- Código: `server/db-attributes.ts`, `client/src/components/DynamicAttributeRenderer.tsx`

---

**Versão:** 1.0  
**Última atualização:** 12/05/2026  
**Autor:** Manus AI
