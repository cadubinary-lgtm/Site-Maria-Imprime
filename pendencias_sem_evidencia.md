# Pendências que Permaneceram sem Evidência Técnica

**Atualizado em:** 12 de agosto de 2026  
**Escopo:** tarefas do `todo.md` que continuam marcadas como pendentes porque não foi possível comprová-las de forma segura no código, nos testes ou nos checkpoints recentes.

> Esta lista é um panorama de planejamento. O `todo.md` contém fases históricas e alguns blocos duplicados; por isso, a quantidade bruta de checkboxes pendentes não representa necessariamente a mesma quantidade de funcionalidades inéditas.

## 1. Orçamento personalizado

| Prioridade sugerida | Pendência | Observação para decisão |
|---|---|---|
| Alta | Definir previsão manual de conclusão antes de gerar o PDF | Requer confirmar se a previsão deve ser apenas informativa ou persistida no orçamento. |
| Alta | Gerar e conferir PDF de exemplo contra a tela | Falta uma validação visual prática com um orçamento real de referência. |
| Média | Aplicar ajustes técnicos pendentes para conferência visual | Deve ser executado somente após a validação do PDF de exemplo. |

## 2. Consolidação do próprio `todo.md`

| Prioridade sugerida | Pendência | Observação para decisão |
|---|---|---|
| Alta | Auditar e consolidar seções duplicadas do todo.md com evidência técnica atual | Existem planos duplicados de CRM, financeiro e segmentos. A recomendação é consolidar as entradas históricas, sem marcar itens por suposição. |
| Média | Revisar referências históricas de testes, versões e módulos antigos | Há descrições de funcionalidades concluídas em fases antigas que precisam de confirmação atual antes de alterar seu status. |

## 3. Web2Print e validação de arquivos

| Prioridade sugerida | Pendência | Observação para decisão |
|---|---|---|
| Média | Criar componente de validação de arquivos | Inclui DPI, CMYK, sangria e margem. |
| Média | Criar estados de arquivo | Fluxo previsto: enviado, em análise, aprovado e correção. |
| Média | Integrar validação ao detalhe do produto | Deve ser desenhado sem interromper o upload atual de arte. |
| Média | Escrever testes de validação | Necessário antes de liberar regras automáticas de reprovação. |

## 4. Automação e notificações

| Prioridade sugerida | Pendência | Observação para decisão |
|---|---|---|
| Média | Automatizar notificações por eventos | Pagamento, produção, entrega e alteração de status. |
| Média | Integrar WhatsApp automatizado | Exige definir provedor e consentimento do cliente. |
| Média | Completar e-mail automático por eventos | O envio manual de orçamento já existe; esta pendência se refere a disparos automáticos. |
| Baixa | Criar e testar gatilhos de automação | Depende da definição dos eventos prioritários. |

## 5. Financeiro, fiscal e relatórios

| Prioridade sugerida | Pendência | Observação para decisão |
|---|---|---|
| Média | Auditar o bloco duplicado de financeiro | Há páginas e procedimentos financeiros atuais, mas o plano histórico de dashboard, relatórios e custo/lucro deve ser confirmado individualmente. |
| Baixa | Gestão fiscal, notas fiscais e configurações de certificado | Exige decisão sobre fornecedor fiscal, certificado e emissão. |
| Baixa | Fluxo de caixa e relatórios gerenciais completos | Deve ser definido após a consolidação do financeiro atual. |

## 6. Logística e frete

| Prioridade sugerida | Pendência | Observação para decisão |
|---|---|---|
| Média | Regras locais por bairro e faixa de CEP | Prevê substituir regra por cidade por bairro, CEP inicial e CEP final. |
| Média | Horário de corte de produção | Inclui campo de cut-off, cálculo de prazo e aviso no produto. |
| Baixa | Cobertura de testes para regras locais de entrega | Cenários de CEP e transportadora precisam ser definidos com dados reais. |

## 7. Atributos dinâmicos e regras de preço

| Prioridade sugerida | Pendência | Observação para decisão |
|---|---|---|
| Alta | Consolidar os planos duplicados de atributos e regras | O `todo.md` contém arquiteturas sobrepostas para atributos, regras condicionais e precificação. Deve existir uma única fonte de verdade. |
| Média | Precificação baseada em regras reutilizáveis | Inclui schema, CRUD, editor, duplicação, toggle e integração com cálculo. |
| Média | Múltiplos segmentos por produto | Inclui relacionamento, seletor, busca/criação e testes. |
| Média | Regras inteligentes por categoria | Compatibilidade de atributos, renderização e validação por produto. |
| Baixa | UX, responsividade e estados de carregamento dos atributos | Deve ser feito após consolidar o motor de regras. |

## 8. Testes de integração e estabilidade

| Prioridade sugerida | Pendência | Observação para decisão |
|---|---|---|
| Alta | Validar compatibilidade de produtos, pedidos e formulários antigos | Serve como proteção antes de grandes refatorações em atributos ou preço. |
| Média | Executar testes de integração entre módulos | Priorizar produto → carrinho → pedido → produção → financeiro. |
| Média | Testar em diferentes dispositivos e navegadores | Recomenda-se definir uma matriz mínima de navegadores e telas. |

## Sequência recomendada para o próximo planejamento

1. **Validar o PDF de exemplo e definir a previsão manual de conclusão do orçamento.**
2. **Consolidar o `todo.md` e os planos duplicados de atributos/CRM/financeiro com evidência técnica.**
3. **Executar testes de compatibilidade antes de qualquer mudança ampla de preço, atributos ou logística.**
4. **Escolher uma frente de evolução:** Web2Print, automação, logística ou financeiro/fiscal.

> A recomendação é não iniciar simultaneamente regras de preço, atributos e logística: as três frentes impactam o configurador e exigem uma definição única de cálculo.
