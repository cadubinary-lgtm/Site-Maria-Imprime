# Incidente de Produção — Financeiro

- Data da verificação: 2026-08-12
- Rota testada: `https://mariaimprime.com.br/admin/financeiro/receber`
- Resultado visual: página em branco, sem elementos interativos renderizados.
- Logs de produção: inicializações repetidas do servidor e registros recorrentes de `Missing session cookie`; não houve erro financeiro específico nos logs disponíveis.

Próximos passos: inspecionar os erros do bundle de cliente e a sessão de autenticação da rota financeira antes de alterar qualquer regra de negócio.
