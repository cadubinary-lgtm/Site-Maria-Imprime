# Validação visual — carrinho lateral

Na rota `/produto/1200001`, o carrinho lateral efetivamente montado pela interface abriu corretamente pelo ícone do cabeçalho. O estado vazio preserva a ação **Continuar comprando** e não apresentou sobreposição, erro de renderização ou alteração no configurador. Os atalhos do estado com itens foram cobertos por teste de regressão e utilizam ações independentes, sem aninhar um botão dentro de um link.

A ação **Continuar comprando** foi acionada no estado vazio e recolheu o painel lateral sem alterar a rota `/produto/1200001` nem interromper o configurador.
