# Validação visual — Central de Gabaritos

- Data: 2026-08-22.
- Rota interna conferida: `/gabaritos`.
- A página abriu com cabeçalho rosa, navegação estrutural, atalho para as Normas de envio de arte e rodapé completo.
- Como ainda não há arquivos publicados na nova tabela, foi exibido corretamente o estado vazio “Gabaritos em preparação”, com ação para contato e retorno ao catálogo.
- O link “Gabaritos” apareceu na coluna Ajuda e suporte do rodapé.

## Teste autenticado em produção

Em 2026-08-22, a sessão administrativa oficial abriu corretamente a rota `/admin/configuracoes-site/gabaritos`. O botão **Adicionar à biblioteca** abriu o formulário de cadastro e os campos de título e descrição aceitaram o preenchimento do arquivo temporário de validação. O próximo passo é anexar o arquivo, salvar, vincular a um produto e confirmar o download público antes de remover o registro de teste.

O arquivo SVG temporário `gabarito-validacao-temporario.svg` foi anexado com sucesso pelo seletor nativo. A interface exibiu a confirmação “Arquivo de gabarito enviado”, mostrou o nome e o tamanho do arquivo (1 KB) e habilitou a ação de concluir o cadastro.

Ao concluir o cadastro no domínio oficial, a mutação retornou `You do not have required permission (10002)`. A causa foi identificada no router de Gabaritos: as mutações usavam a autorização exclusiva do Manus OAuth, enquanto o painel oficial usa a sessão `admin_session`. O router foi ajustado localmente para adotar o procedimento compatível com ambos os tipos de sessão e precisa ser publicado antes da repetição do teste real.

Após a publicação da correção de autorização, o domínio oficial voltou a abrir o formulário pela Biblioteca de arquivos e aceitou novamente o preenchimento dos campos de título e descrição para a repetição do teste de cadastro.

Na repetição, o arquivo temporário foi novamente anexado com sucesso e a confirmação de envio apareceu antes de salvar o registro. A próxima ação pendente é concluir o cadastro com a autorização corrigida.
