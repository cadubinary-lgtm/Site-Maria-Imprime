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

Após a publicação do checkpoint de autorização, a consulta oficial `printTemplates.listAdmin` retornou HTTP 200 com lista vazia, confirmando que a sessão administrativa passou a ser reconhecida pelo router de Gabaritos. O teste de cadastro pode prosseguir.

O formulário de validação foi reaberto no domínio oficial e recebeu novamente o título e a descrição do gabarito temporário. O arquivo, o vínculo ao produto e o download público serão testados em seguida.

O arquivo SVG temporário foi anexado e o envio foi concluído no domínio oficial, com o nome do arquivo e o tamanho de 1 KB exibidos pelo formulário. O botão de adicionar está disponível para concluir o cadastro publicado.

O cadastro temporário foi salvo com sucesso no domínio oficial, confirmado pela mensagem “Gabarito adicionado” e pelo card publicado na Biblioteca. Em seguida, o editor de **Lona Impressa** abriu o campo “Gabarito recomendado”, inicialmente sem vínculo, pronto para selecionar o arquivo temporário.

No editor de Lona Impressa, o seletor exibiu o gabarito temporário publicado. Após a seleção, a interface confirmou “Salvo automaticamente” e manteve “Gabarito de validação temporário” como o arquivo recomendado do produto.

A Central pública de Gabaritos exibiu o card publicado e o botão **Baixar gabarito**. O acionamento abriu o SVG temporário por uma URL assinada de armazenamento, e o conteúdo do arquivo foi renderizado corretamente no navegador. O upload, o vínculo e o download público foram validados; resta desfazer o vínculo e remover o registro temporário de teste.

Ao reabrir a edição de Lona Impressa, o campo “Gabarito recomendado” continuou exibindo o arquivo temporário, confirmando que o vínculo foi persistido. A limpeza do vínculo e do registro temporário será feita na sequência.

O vínculo de validação foi removido pelo mesmo seletor e a interface confirmou “Salvo automaticamente”, voltando a exibir “Nenhum gabarito vinculado” para Lona Impressa. O produto foi restaurado antes da remoção do registro temporário.

O registro temporário foi removido pela confirmação administrativa. A Biblioteca voltou ao estado sem arquivos e a mensagem confirmou que produtos vinculados ficaram sem gabarito, preservando a limpeza do teste. A validação ponta a ponta foi concluída com upload, publicação, vínculo, persistência, download público e remoção.
