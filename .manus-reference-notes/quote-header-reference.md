# Referência do cabeçalho do orçamento

- A referência panorâmica confirma a composição existente: logo no bloco esquerdo, dados operacionais abaixo, identificador do orçamento no bloco direito e linha rosa de separação.
- O texto “Maria Imprime” não deve ser repetido junto ao CNPJ, pois a logo já identifica a empresa.
- A referência de contato apresenta o endereço abaixo dos demais dados da empresa e usa o ícone oficial do WhatsApp para telefone.
- O novo responsável deve integrar o cabeçalho sem deslocar a estrutura de identificação do orçamento, cliente ou a linha de separação.

## Verificação de interface

A rota administrativa de novo orçamento redireciona corretamente para autenticação quando a sessão não está disponível no ambiente de validação. Por isso, a interface autenticada foi validada por TypeScript e testes de regressão, sem realizar login ou alterar dados do usuário.
