# Design System - Maria Imprime

## 📋 Visão Geral

O Design System centraliza todas as cores, tipografia, espaçamento e componentes do sistema. Todos os componentes devem usar este sistema para garantir consistência visual em toda a plataforma.

---

## 🎨 Cores

### Paleta Principal

**Primária: Rosa Magenta**
- `#E91E63` - Main
- `#F06292` - Light
- `#F48FB1` - Lighter
- `#C2185B` - Dark
- `#880E4F` - Darker

**Secundária: Laranja**
- `#FF6B35` - Main
- `#FF8A5B` - Light
- `#FFB088` - Lighter
- `#E55100` - Dark
- `#BF360C` - Darker

### Neutros

- **Branco**: `#FFFFFF`
- **Off-White**: `#F9FAFB`
- **Light Gray**: `#F3F4F6`
- **Gray**: `#E5E7EB`
- **Medium Gray**: `#D1D5DB`
- **Dark Gray**: `#9CA3AF`
- **Text Light**: `#6B7280`
- **Text Medium**: `#4B5563`
- **Text Dark**: `#374151`
- **Text Darker**: `#111827`
- **Black**: `#000000`

### Estados

- **Success**: `#10B981`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`
- **Info**: `#3B82F6`

---

## 📝 Tipografia

### Fonte Primária
```
'Bahnschrift', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif
```

### Tamanhos
- `xs`: 12px
- `sm`: 14px
- `base`: 16px
- `lg`: 18px
- `xl`: 20px
- `2xl`: 24px
- `3xl`: 30px
- `4xl`: 36px
- `5xl`: 48px
- `6xl`: 60px

### Pesos
- `light`: 300
- `normal`: 400
- `medium`: 500
- `semibold`: 600
- `bold`: 700
- `extrabold`: 800
- `black`: 900

### Estilos Predefinidos

**Headings:**
```typescript
import { useTheme } from "@/hooks/useTheme";

const theme = useTheme();
const h1Style = theme.typography.heading.h1;
const h2Style = theme.typography.heading.h2;
```

**Body Text:**
```typescript
const bodyLarge = theme.typography.body.large;
const bodyBase = theme.typography.body.base;
const bodySmall = theme.typography.body.small;
```

---

## 🎯 Espaçamento

| Token | Valor |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 20px |
| `2xl` | 24px |
| `3xl` | 28px |
| `4xl` | 32px |
| `5xl` | 36px |
| `6xl` | 40px |
| `8xl` | 48px |
| `10xl` | 56px |
| `12xl` | 64px |

---

## 🔲 Border Radius

| Token | Valor |
|-------|-------|
| `none` | 0px |
| `xs` | 2px |
| `sm` | 4px |
| `md` | 6px |
| `lg` | 8px |
| `xl` | 12px |
| `2xl` | 16px |
| `3xl` | 20px |
| `full` | 9999px |
| `pill` | 50px |

---

## 🎁 Componentes Predefinidos

### ThemedButton

```typescript
import { ThemedButton } from "@/components/ThemedButton";

// Primary (padrão)
<ThemedButton>Clique aqui</ThemedButton>

// Secondary
<ThemedButton variant="secondary">Ação Secundária</ThemedButton>

// Outline
<ThemedButton variant="outline">Outline</ThemedButton>

// Tamanhos
<ThemedButton size="sm">Pequeno</ThemedButton>
<ThemedButton size="md">Médio</ThemedButton>
<ThemedButton size="lg">Grande</ThemedButton>

// Com onClick
<ThemedButton onClick={() => console.log("Clicado!")}>
  Clique
</ThemedButton>

// Desabilitado
<ThemedButton disabled>Desabilitado</ThemedButton>
```

### ThemedCard

```typescript
import { ThemedCard } from "@/components/ThemedCard";

// Básico
<ThemedCard>
  Conteúdo do card
</ThemedCard>

// Com hover
<ThemedCard hover>
  Card com efeito hover
</ThemedCard>

// Com onClick
<ThemedCard onClick={() => navigate("/produto/1")}>
  Clique para abrir
</ThemedCard>

// Com estilo customizado
<ThemedCard style={{ padding: "2rem" }}>
  Card com padding customizado
</ThemedCard>
```

### ThemedInput

```typescript
import { ThemedInput } from "@/components/ThemedInput";

// Básico
<ThemedInput placeholder="Digite aqui..." />

// Com value e onChange
<ThemedInput
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Email"
  type="email"
/>

// Desabilitado
<ThemedInput disabled placeholder="Desabilitado" />

// Com validação
<ThemedInput
  required
  type="password"
  placeholder="Senha"
/>
```

---

## 🎨 Usando o Design System

### Opção 1: Hook `useTheme()`

```typescript
import { useTheme } from "@/hooks/useTheme";

export function MyComponent() {
  const theme = useTheme();

  return (
    <div style={{
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
    }}>
      <h1 style={{
        fontFamily: theme.typography.fontFamily.primary,
        fontSize: theme.typography.fontSize["3xl"],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary.main,
      }}>
        Título
      </h1>
    </div>
  );
}
```

### Opção 2: Helpers do Theme

```typescript
import { themeHelpers } from "@/hooks/useTheme";

export function MyComponent() {
  return (
    <div style={themeHelpers.getCardStyle()}>
      <h1 style={themeHelpers.getHeadingStyle("h1")}>
        Título
      </h1>
      <p style={themeHelpers.getBodyStyle("base")}>
        Texto do corpo
      </p>
      <button style={themeHelpers.getButtonStyle("primary")}>
        Botão
      </button>
    </div>
  );
}
```

### Opção 3: Componentes Temáticos

```typescript
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedCard } from "@/components/ThemedCard";
import { ThemedInput } from "@/components/ThemedInput";

export function MyComponent() {
  return (
    <ThemedCard>
      <ThemedInput placeholder="Nome" />
      <ThemedButton>Enviar</ThemedButton>
    </ThemedCard>
  );
}
```

---

## 📐 Container & Breakpoints

### Container Max Widths

| Token | Valor |
|-------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Container Padding

| Breakpoint | Padding |
|-----------|---------|
| Mobile | 16px |
| Tablet | 24px |
| Desktop | 48px |

### Breakpoints

| Token | Valor |
|-------|-------|
| `xs` | 0px |
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

---

## ✨ Sombras

| Token | Descrição |
|-------|-----------|
| `xs` | Sombra muito leve |
| `sm` | Sombra leve |
| `md` | Sombra média |
| `lg` | Sombra grande |
| `xl` | Sombra extra grande |
| `card` | Sombra padrão para cards |
| `hover` | Sombra ao passar o mouse |

---

## ⏱️ Transições e Animações

### Transições Predefinidas

```typescript
const theme = useTheme();

// Duração rápida
theme.transitions.fast // 0.15s ease

// Duração padrão
theme.transitions.base // 0.3s ease

// Duração lenta
theme.transitions.slow // 0.5s ease

// Duração mais lenta
theme.transitions.slower // 0.8s ease
```

### Animações Predefinidas

```typescript
// Fade In
theme.animations.fadeIn

// Slide Up
theme.animations.slideUp

// Slide Down
theme.animations.slideDown

// Slide Left
theme.animations.slideLeft

// Slide Right
theme.animations.slideRight

// Scale In
theme.animations.scaleIn
```

---

## 🚀 Boas Práticas

### ✅ Faça

1. **Use o Design System para tudo**
   ```typescript
   // ✅ Correto
   <div style={{ backgroundColor: theme.colors.primary.main }}>
   ```

2. **Centralize cores em um único lugar**
   ```typescript
   // ✅ Correto
   const theme = useTheme();
   const bgColor = theme.colors.primary.main;
   ```

3. **Use componentes temáticos**
   ```typescript
   // ✅ Correto
   <ThemedButton variant="primary">Clique</ThemedButton>
   ```

4. **Respeite o espaçamento**
   ```typescript
   // ✅ Correto
   padding: theme.spacing.lg
   ```

### ❌ Não Faça

1. **Não hardcode cores**
   ```typescript
   // ❌ Errado
   <div style={{ backgroundColor: "#E91E63" }}>
   ```

2. **Não use cores arbitrárias**
   ```typescript
   // ❌ Errado
   <div style={{ color: "#abc123" }}>
   ```

3. **Não misture espaçamentos**
   ```typescript
   // ❌ Errado
   padding: "20px" // Usar theme.spacing
   ```

4. **Não crie novos componentes sem usar o tema**
   ```typescript
   // ❌ Errado
   <button style={{ backgroundColor: "blue" }}>
   ```

---

## 📦 Arquivo de Referência

O Design System está definido em:
```
client/src/theme/designSystem.ts
```

E o hook para acessá-lo:
```
client/src/hooks/useTheme.ts
```

---

## 🔄 Atualizando o Design System

Se precisar adicionar novas cores, espaçamentos ou componentes:

1. Edite `client/src/theme/designSystem.ts`
2. Adicione a nova propriedade ao objeto `theme`
3. Use em seus componentes via `useTheme()`
4. Documente aqui neste arquivo

---

## 📞 Suporte

Para dúvidas sobre o Design System, consulte:
- `client/src/theme/designSystem.ts` - Definições
- `client/src/hooks/useTheme.ts` - Hooks e helpers
- `client/src/components/Themed*.tsx` - Componentes de exemplo
