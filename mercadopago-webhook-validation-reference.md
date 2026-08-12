# Referência de validação — Mercado Pago Webhooks

**Fonte oficial:** https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications/webhooks

## Dados exigidos para validar a origem

- Cabeçalho `x-signature`, no formato `ts=<timestamp>,v1=<assinatura>`.
- Cabeçalho `x-request-id`.
- Identificador `data.id` recebido na query string da notificação.
- Assinatura secreta (`secret`) criada em **Suas integrações > Webhooks > Configurar notificações**.

## Validação recomendada pelo SDK JavaScript

```ts
WebhookSignatureValidator.validate({
  xSignature: req.headers['x-signature'],
  xRequestId: req.headers['x-request-id'],
  dataId: req.query['data.id'],
  secret,
});
```

Uma assinatura inválida deve retornar `401` antes de executar alterações em pagamento, pedido ou envio de e-mail.

## Observações de implementação

- A assinatura secreta não é aplicável a notificações de QR Code.
- Após confirmar a assinatura, consultar o pagamento pela API oficial continua sendo a fonte confiável para o status e a referência externa.
- O Mercado Pago recomenda responder `200` ou `201` para notificações recebidas corretamente; o prazo indicado para confirmação é de 22 segundos.
