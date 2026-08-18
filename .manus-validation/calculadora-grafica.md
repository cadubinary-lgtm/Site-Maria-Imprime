# Validação visual — Calculadora Gráfica

- A rota pública `/calculadora-demo` carregou sem erros visuais no desktop, exibindo os campos de largura e altura, a área, a estimativa demonstrativa e o retorno à página inicial.
- A interface expõe rótulos, instruções associadas aos campos e ação nomeada para limpar a largura quando há valor informado.
- A validação com teclado identificou que a posição do cursor podia alterar a sequência financeira. A entrada por tecla foi corrigida para anexar cada dígito à direita do valor interno, com teste de regressão para a sequência e para o limite de dez dígitos. No navegador, a largura progrediu corretamente de `0,00 m` para `0,01 m` e depois para `0,12 m` ao pressionar as teclas `1` e `2`.
