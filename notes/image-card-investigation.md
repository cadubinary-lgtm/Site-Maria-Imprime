# Verificação de imagem no card público

- Rota inspecionada: `/todos-produtos`.
- A imagem de `Lona Impressa` possui proporção quadrada nativa de 759 × 759 pixels.
- O contêiner exibido também é quadrado e, no estado sem interação, a imagem usa `object-fit: contain` e não possui transformação aplicada.
- Para impedir qualquer recorte residual durante interações, o card deve deixar de recortar o contêiner da imagem e não aplicar ampliação que exceda seus limites.

Após o ajuste, a rota foi revisada novamente. A imagem permanece exibida em um contêiner quadrado com proporção compatível com seu arquivo de origem, e o card não aplica mais escala no hover nem recorte no contêiner da imagem.
