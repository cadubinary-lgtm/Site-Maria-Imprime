## Validação de interface do avanço automático

- Em 20 de agosto de 2026, a navegação para `/admin/orcamentos/novo` foi redirecionada para a tela de autenticação Manus.
- Não foi realizada autenticação automática nem interação na conta do usuário.
- A validação do intervalo foi feita por teste funcional com temporizadores simulados: o campo confirma somente após 800 ms e reinicia a contagem quando há nova digitação.
- A cobertura de regressão também confirma que os campos monetários visíveis do formulário usam o agendador compartilhado.
