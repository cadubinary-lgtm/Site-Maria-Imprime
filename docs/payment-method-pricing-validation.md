# Validação de preços por forma de pagamento

Data da validação: 16 de agosto de 2026.

A página pública da Lona Impressa apresentou no resumo do configurador os dois valores de forma explícita: o valor no Pix e o valor no cartão de crédito. Como os preços migrados foram preenchidos inicialmente com o valor comercial já existente, ambos aparecem iguais até que o administrador configure um desconto no Pix.

A tentativa de inspeção visual da rota administrativa redirecionou para a autenticação do painel. A presença dos novos campos administrativos foi, portanto, coberta por teste de regressão de código, TypeScript e pela persistência validada no banco de dados.
