# Diagnóstico — geração de recibos

Em 25/08/2026, foi confirmado que `confirmarPagamento` chama `ensurePaymentReceipt`, mas `atualizarStatusRetirada` atualiza `orders.paymentStatus` para `pago` sem chamar a mesma rotina. Assim, pagamentos presenciais concluídos pelo painel de retirada não criam nem vinculam recibos.

A correção deve reutilizar `ensurePaymentReceipt` no fluxo de retirada quando o pagamento for confirmado, preservando os status e transições existentes. A conferência do banco também identificou pedidos pagos sem registro em `paymentReceipts`, que precisarão ser recuperados de forma idempotente após a correção.
