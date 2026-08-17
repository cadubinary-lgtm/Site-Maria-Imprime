# Validação visual — botões do Guia da Maria

A página `/produto/1200001` exibiu os dois links do rodapé do Guia da Maria na mesma área de ação: `Ver normas para envio de arte` direciona para `/documentos` e usa a variante secundária branca com contorno rosa; `Falar com a Maria` direciona para `#maria-guide-entrega` e usa a variante principal rosa preenchida. A composição permanece lado a lado em largura de configurador e os textos quebram de forma controlada dentro dos botões, sem alterar os destinos.

## Medições computadas

Os dois links foram encontrados com `display: flex`, bordas arredondadas e altura uniforme de 56px no configurador. O botão secundário apresentou fundo branco, borda sólida de 1px e largura de 152px, com destino `/documentos`. O botão principal apresentou gradiente rosa, sem borda, largura de 136px e destino `#maria-guide-entrega`. A diferença de largura acompanha o texto de cada ação; a altura e a hierarquia visual permanecem padronizadas.
