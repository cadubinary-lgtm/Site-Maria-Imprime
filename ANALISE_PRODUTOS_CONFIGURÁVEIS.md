# Análise: Reorganização de Produtos Configuráveis

## 1. Estrutura Atual

O banco de dados já possui uma base para variações de produtos:

| Tabela | Função |
|--------|--------|
| `products` | Produtos base com preço e descrição |
| `variationTypes` | Tipos de variações (material, acabamento, etc) |
| `variationOptions` | Opções dentro de cada tipo (Ex: "Adesivo Brilho") |
| `orderItemVariations` | Variações selecionadas no pedido |

**Problema Atual:** O schema existe mas não está sendo utilizado. Os produtos estão sendo criados manualmente como itens separados.

---

## 2. Estratégia de Reorganização

### Opção Escolhida: Produtos Configuráveis com Variações Dinâmicas

Vamos manter a estrutura existente e expandir para suportar:

1. **Dois produtos principais:** Adesivo e Lona
2. **Variações dinâmicas:** Tipo de impressão, mídia, gramatura, acabamento
3. **Preços por variação:** Cada combinação pode ter um preço diferente
4. **Painel admin completo:** Gerenciar variações sem criar produtos separados

---

## 3. Novo Schema (Extensões Necessárias)

### 3.1 Tabela: `productVariationCombinations`

Armazena combinações pré-calculadas de variações com seus preços.

```sql
CREATE TABLE productVariationCombinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  variationOptionIds JSON NOT NULL, -- Array de IDs das opções selecionadas
  basePrice DECIMAL(10, 2) NOT NULL,
  totalPriceModifier DECIMAL(10, 2) DEFAULT 0,
  finalPrice DECIMAL(10, 2) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id)
);
```

### 3.2 Extensão: Campo `isConfigurable` em `products`

```sql
ALTER TABLE products ADD COLUMN isConfigurable BOOLEAN DEFAULT FALSE;
```

---

## 4. Estrutura de Variações por Produto

### 4.1 ADESIVO

**Variação 1: Tipo de Impressão**
- Eco Solvente
- UV

**Variação 2: Tipo de Mídia**
- Adesivo Brilho
- Adesivo Fosco
- Adesivo Transparente
- Adesivo Blackout

**Variação 3: Tipo de Material**
- Promocional
- Premium

**Variação 4: Tipo de Acabamento**
- Refile
- Meio Corte
- Corte Total
- Sem Acabamento

### 4.2 LONA

**Variação 1: Tipo de Impressão**
- Eco Solvente
- UV

**Variação 2: Tipo de Mídia**
- Lona Brilho
- Lona Fosca
- Backlight
- Sanet

**Variação 3: Tipo de Gramatura** (Condicional)
- Apenas para: Lona Brilho, Lona Fosca
- Opções: 280g, 380g, 440g, 1000x1000 fios

**Variação 4: Tipo de Acabamento**
- Bainha e Ilhós
- Bainha e Ilhós + Reforço
- Bainha e Ilhós + Verniz
- Bainha e Ilhós + Reforço + Verniz
- Sem acabamento + Verniz
- Nenhum acabamento

---

## 5. Fluxo de Implementação

### Fase 1: Schema
- Adicionar campo `isConfigurable` aos produtos
- Criar tabela `productVariationCombinations`
- Executar migrations

### Fase 2: Backend (tRPC)
- Procedures para criar/editar variações
- Procedures para calcular preço final
- Procedures para listar combinações

### Fase 3: Admin UI
- Interface para gerenciar variações
- Editor de preços por combinação
- Visualização de todas as combinações

### Fase 4: Frontend
- Seletor de variações no detalhe do produto
- Cálculo de preço em tempo real
- Integração com carrinho

### Fase 5: Testes
- Testes de CRUD de variações
- Testes de cálculo de preços
- Testes de fluxo completo

---

## 6. Considerações Técnicas

### 6.1 Cálculo de Preço

```
Preço Final = Preço Base + Soma dos Modificadores das Opções Selecionadas
```

### 6.2 Validação de Variações

- Verificar se todas as variações obrigatórias foram selecionadas
- Validar se a combinação é válida (Ex: Gramatura só para Lona Brilho/Fosca)

### 6.3 Compatibilidade com Calculadora de m²

- Manter suporte para cálculo de área
- Aplicar modificadores de preço após cálculo de m²

---

## 7. Próximos Passos

1. ✅ Análise concluída
2. ⏳ Atualizar schema do banco de dados
3. ⏳ Criar procedures tRPC
4. ⏳ Implementar admin UI
5. ⏳ Criar página de detalhes com seletor
6. ⏳ Escrever testes
7. ⏳ Fazer checkpoint final
