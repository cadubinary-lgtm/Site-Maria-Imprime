# Gráfica Ponto Digital - TODO

## Fase 1: Estrutura e Direção Visual
- [x] Definir paleta de cores (azul profissional + laranja vibrante)
- [x] Criar schema de banco de dados (produtos, pedidos, usuários com 3 roles)
- [x] Executar migrations do banco de dados

## Fase 2: Autenticação
- [x] Implementar três papéis: cliente, admin, produção
- [x] Criar procedimentos protegidos por role
- [x] Testar fluxos de login/logout para cada papel

## Fase 3: Painel Admin
- [x] Criar interface para criar novo produto
- [x] Implementar criar novo produto (nome, descrição, preço, segmento, foto)
- [ ] Implementar editar produto
- [ ] Implementar remover produto
- [x] Criar visualização de todos os pedidos
- [x] Testar CRUD de produtos (create funcional)

## Fase 4: Catálogo de Produtos (Cliente)
- [x] Corrigir menu (sem duplicação)
- [x] Implementar listagem de produtos por segmento (alimentação, beleza, varejo, serviços)
- [x] Exibir fotos reais dos produtos (não ícones genéricos)
- [x] Exibir descrição, preço e segmento
- [x] Implementar filtro por segmento
- [x] Testar visualização de produtos

## Fase 5: Fluxo de Compra
- [ ] Criar página de detalhes do produto
- [ ] Implementar seleção de quantidade
- [ ] Implementar upload de arquivo de arte (validação de tipo/tamanho)
- [ ] Integrar pagamento (simulado)
- [ ] Criar confirmação de pedido
- [ ] Testar fluxo completo de compra

## Fase 6: Painel de Produção (Kanban)
- [x] Criar layout Kanban com colunas: aguardando, em produção, enviado, entregue
- [ ] Implementar drag-and-drop entre colunas
- [x] Exibir informações do pedido no card (cliente, produto, data)
- [x] Implementar atualização de status
- [ ] Testar Kanban completo

## Fase 7: Acompanhamento e Notificações
- [x] Criar página de acompanhamento de pedido para cliente
- [x] Exibir histórico de status com datas
- [ ] Implementar notificação automática ao cliente quando status muda
- [ ] Testar notificações

## Fase 8: Testes e Correções
- [ ] Testar fluxo completo: cliente → compra → admin vê → produção processa → cliente recebe notificação
- [x] Corrigir erros visuais e duplicações
- [ ] Validar responsividade
- [ ] Testar em diferentes navegadores

## Fase 9: Deploy
- [ ] Criar checkpoint final
- [ ] Entregar projeto ao usuário
