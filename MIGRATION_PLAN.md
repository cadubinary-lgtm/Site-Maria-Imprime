# PLANO DE MIGRAÇÃO: Tipos de Variação Globais

## 📋 OBJETIVO

Transformar a estrutura de variações de **"por produto"** para **"globais + relacionamento"**, mantendo total compatibilidade com o sistema atual.

---

## 🔍 ESTRUTURA ATUAL (ANÁLISE)

### Tabela: `variationTypes`
```
Campos atuais:
- id (PK)
- productId (FK) ← PROBLEMA: Tipos duplicados por produto
- type (enum)
- name (varchar)
- slug (varchar)
- description (longtext)
- selectionType (enum)
- visualType (varchar)
- order (int)
- isRequired (boolean)
- isActive (boolean)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Problema Identificado
- ✅ Tipos com mesmo nome duplicados em múltiplos produtos
- ✅ Exemplo: "Acabamento" existe em Folheto, Cartão, Lona (3 registros)
- ✅ Configurações (obrigatório, ordem) duplicadas também
- ✅ Sem reutilização entre produtos

### Dados Existentes
- Produtos com variações: ~5-10 produtos
- Tipos de variação: ~20-30 registros (com duplicações)
- Tipos únicos: ~10-15 nomes diferentes
- Opções por tipo: 2-5 opções em média

---

## 🎯 ESTRUTURA ALVO

### Tabela: `variationTypes` (REFATORADA)
```
Campos finais:
- id (PK)
- type (enum)
- name (varchar) ← GLOBAL, sem productId
- slug (varchar)
- description (longtext)
- selectionType (enum)
- visualType (varchar)
- createdAt (timestamp)
- updatedAt (timestamp)

Nota: Sem productId, sem order, sem isRequired, sem isActive
```

### Tabela: `productVariationTypes` (NOVA)
```
Campos:
- id (PK)
- productId (FK → products.id)
- variationTypeId (FK → variationTypes.id)
- isRequired (boolean) ← Configuração do vínculo
- order (int) ← Ordem específica do produto
- isActive (boolean) ← Ativo/inativo por produto
- createdAt (timestamp)
- updatedAt (timestamp)

Constraints:
- UNIQUE (productId, variationTypeId) ← Evita duplicação
- Foreign keys com CASCADE delete
```

---

## 📊 ESTRATÉGIA DE MIGRAÇÃO (3 FASES)

### FASE 1: Preparação (SEM RISCO)
✅ **Status**: Já concluído
- [x] Criar tabela `productVariationTypes` (já existe)
- [x] Sem alterar dados existentes
- [x] Sem remover campos de `variationTypes`
- [x] Sistema continua funcionando normalmente

### FASE 2: Migração de Dados (INCREMENTAL)
⏳ **Status**: Próxima etapa
- [ ] Identificar tipos únicos (deduplicação)
- [ ] Criar novos registros em `variationTypes` (sem productId)
- [ ] Mapear dados antigos para novos tipos
- [ ] Popular `productVariationTypes` com dados migrados
- [ ] Validar integridade dos dados
- [ ] Testar fluxo com dados migrados

### FASE 3: Refatoração (GRADUAL)
⏳ **Status**: Após validação
- [ ] Atualizar queries para usar `productVariationTypes`
- [ ] Manter compatibilidade com dados antigos
- [ ] Remover `productId` de `variationTypes` (futuro)
- [ ] Atualizar frontend para novo modelo

---

## 🔄 PROCESSO DE MIGRAÇÃO DETALHADO

### PASSO 1: Identificar Tipos Únicos
```sql
-- Encontrar tipos com mesmo nome
SELECT DISTINCT name FROM variationTypes ORDER BY name;

-- Resultado esperado: ~10-15 nomes únicos
```

### PASSO 2: Criar Tipos Globais
```sql
-- Para cada tipo único, criar registro em variationTypes (novo)
-- Sem productId, sem order, sem isRequired

INSERT INTO variationTypes_new (type, name, slug, description, selectionType, visualType)
SELECT DISTINCT type, name, slug, description, selectionType, visualType
FROM variationTypes
WHERE productId IS NOT NULL;

-- Resultado: ~10-15 registros globais
```

### PASSO 3: Mapear Dados Antigos
```sql
-- Criar mapping entre tipos antigos e novos
CREATE TEMPORARY TABLE type_mapping (
  old_id INT,
  new_id INT,
  name VARCHAR(255)
);

-- Popular mapping
INSERT INTO type_mapping
SELECT vt_old.id, vt_new.id, vt_old.name
FROM variationTypes vt_old
JOIN variationTypes_new vt_new ON vt_old.name = vt_new.name;
```

### PASSO 4: Popular productVariationTypes
```sql
-- Copiar dados de variationTypes para productVariationTypes
INSERT INTO productVariationTypes (productId, variationTypeId, isRequired, order, isActive)
SELECT 
  vt.productId,
  tm.new_id,
  vt.isRequired,
  vt.order,
  vt.isActive
FROM variationTypes vt
JOIN type_mapping tm ON vt.id = tm.old_id;

-- Resultado: Todos os relacionamentos migrados
```

### PASSO 5: Validar Integridade
```sql
-- Verificar que nenhum dado foi perdido
SELECT COUNT(*) FROM productVariationTypes;
-- Deve ser ≈ COUNT(*) FROM variationTypes

-- Verificar tipos únicos
SELECT COUNT(DISTINCT variationTypeId) FROM productVariationTypes;
-- Deve ser ≈ 10-15

-- Verificar produtos
SELECT COUNT(DISTINCT productId) FROM productVariationTypes;
-- Deve ser = COUNT(*) FROM products
```

---

## 🛡️ ESTRATÉGIA DE SEGURANÇA

### Retrocompatibilidade
- ✅ Manter `productId` em `variationTypes` durante transição
- ✅ Manter queries antigas funcionando
- ✅ Adicionar queries novas em paralelo
- ✅ Testar ambas as abordagens simultaneamente

### Rollback
- ✅ Se algo der errado, dados antigos ainda existem
- ✅ Pode-se reverter alterações sem perda de dados
- ✅ Checkpoint antes de cada fase

### Validação
- ✅ Verificar integridade após cada passo
- ✅ Testar ProductDetail com dados migrados
- ✅ Testar ProductConfigurator com dados migrados
- ✅ Testar cálculos de preço

---

## 📈 IMPACTO NO SISTEMA

### Sem Quebra
- ✅ ProductDetail continua funcionando
- ✅ ProductConfigurator continua funcionando
- ✅ Cálculos de preço continuam corretos
- ✅ Catálogo continua acessível
- ✅ Regras continuam funcionando

### Com Melhoria
- ✅ Tipos reutilizáveis entre produtos
- ✅ Sem duplicação de tipos
- ✅ Escalável para novos produtos
- ✅ Administração centralizada

---

## 🎯 PRÓXIMAS AÇÕES

### 1. Validação do Plano
- [ ] Revisar plano com stakeholders
- [ ] Confirmar que abordagem está correta
- [ ] Identificar riscos adicionais

### 2. Executar Fase 2
- [ ] Criar script SQL de migração
- [ ] Testar em ambiente de desenvolvimento
- [ ] Validar integridade dos dados
- [ ] Testar fluxo completo

### 3. Executar Fase 3
- [ ] Atualizar queries backend
- [ ] Atualizar frontend
- [ ] Testar compatibilidade
- [ ] Remover compatibilidade antiga (futuro)

---

## ⚠️ RISCOS IDENTIFICADOS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|--------|-----------|
| Perda de dados | Baixa | Alto | Backup antes de migração |
| Quebra de ProductDetail | Média | Alto | Testar com dados migrados |
| Quebra de cálculos | Média | Alto | Validar preços após migração |
| Quebra de regras | Baixa | Alto | Testar regras com dados migrados |
| Duplicação de tipos | Média | Médio | Constraint UNIQUE no banco |

---

## 📝 CHECKLIST DE EXECUÇÃO

### Antes de Migrar
- [ ] Backup completo do banco
- [ ] Criar snapshot do sistema
- [ ] Documentar estado atual
- [ ] Comunicar com stakeholders

### Durante Migração
- [ ] Executar passo 1 (identificar tipos)
- [ ] Executar passo 2 (criar tipos globais)
- [ ] Executar passo 3 (mapear dados)
- [ ] Executar passo 4 (popular relacionamento)
- [ ] Executar passo 5 (validar integridade)

### Após Migração
- [ ] Testar ProductDetail
- [ ] Testar ProductConfigurator
- [ ] Testar cálculos
- [ ] Testar regras
- [ ] Testar admin
- [ ] Criar checkpoint

---

## 🎓 CONCLUSÃO

Este plano permite migrar para uma arquitetura correta **SEM quebrar o sistema atual**. A abordagem incremental garante que podemos reverter em qualquer momento se algo der errado.

**Próximo passo**: Executar Fase 2 após aprovação.
