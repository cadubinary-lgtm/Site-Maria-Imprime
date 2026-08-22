# Validação visual — Biblioteca pública de Gabaritos pesquisável

Data: 22 de agosto de 2026

- A página `/gabaritos` apresenta a busca acima da lista e informa a quantidade total de arquivos disponíveis.
- Os arquivos publicados são exibidos em uma lista vertical compacta, com ícone, nome, descrição, formato, tamanho e botão de download por linha.
- A consulta manual `arquivo inexistente` exibiu corretamente o contador `0 de 2 gabaritos encontrados.` e o estado vazio com a ação para limpar a busca.
- O campo de busca foi ajustado de `type="search"` para `type="text"` após a conferência visual, evitando a duplicação de controles de limpeza em navegadores que fornecem o botão nativo de busca.
