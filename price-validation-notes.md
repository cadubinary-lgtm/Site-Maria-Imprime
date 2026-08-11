# Validação — preço da Lona Impressa

- A tabela `products` possui a Lona Impressa com `price = 1.00` e `pricePerM2 = 75.00`.
- O tipo de cálculo do produto é `m2`; portanto, o valor comercial de vitrine deve vir de `pricePerM2`.
- Os cards de destaque e os resultados da busca pública passaram a usar `formatProductPrice()`, que aplica essa regra centralizada.
- O teste `server/product-price-display.test.ts` confirma que o produto exibe `R$ 75.00/m²` mesmo quando `price` contém o fallback técnico de `1.00`.
- A verificação visual automatizada do preview não retornou conteúdo do DOM; a validação foi concluída pelo teste unitário e pela consulta direta ao banco.
