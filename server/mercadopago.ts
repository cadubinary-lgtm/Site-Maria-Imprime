/**
 * Mercado Pago Integration Helper
 * Handles PIX and Credit Card payments via MP SDK v3
 */
import MercadoPagoConfig, { Payment } from "mercadopago";

// Lazy-initialized client — credentials come from DB settings or env
let _client: MercadoPagoConfig | null = null;

export function getMPClient(accessToken?: string): MercadoPagoConfig {
  const token = accessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  if (!token) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não configurado. Configure nas Configurações do Admin."
    );
  }
  // Re-create if token changed
  if (!_client) {
    _client = new MercadoPagoConfig({ accessToken: token });
  }
  return _client;
}

export function resetMPClient() {
  _client = null;
}

// ─── PIX Payment ────────────────────────────────────────────────────────────

export interface PixPaymentInput {
  orderId: number;
  orderNumber: string;
  amount: number; // in BRL
  payerEmail: string;
  payerName: string;
  payerCpf?: string;
  accessToken?: string;
}

export interface PixPaymentResult {
  paymentId: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  copyPaste: string;
  expiresAt: string;
}

export async function createPixPayment(
  input: PixPaymentInput
): Promise<PixPaymentResult> {
  const client = getMPClient(input.accessToken);
  const payment = new Payment(client);

  const body = {
    transaction_amount: input.amount,
    description: `Pedido #${input.orderNumber} - Gráfica Maria Imprime`,
    payment_method_id: "pix",
    payer: {
      email: input.payerEmail,
      first_name: input.payerName.split(" ")[0] || input.payerName,
      last_name: input.payerName.split(" ").slice(1).join(" ") || "",
      identification: input.payerCpf
        ? { type: "CPF", number: input.payerCpf.replace(/\D/g, "") }
        : undefined,
    },
    external_reference: String(input.orderId),
    notification_url: `${process.env.APP_BASE_URL || ""}/api/payments/mercadopago/webhook`,
  };

  const result = await payment.create({ body });

  if (!result.id) {
    throw new Error("Falha ao criar pagamento PIX no Mercado Pago");
  }

  const txInfo = result.point_of_interaction?.transaction_data;

  return {
    paymentId: String(result.id),
    status: result.status || "pending",
    qrCode: txInfo?.qr_code || "",
    qrCodeBase64: txInfo?.qr_code_base64 || "",
    copyPaste: txInfo?.qr_code || "",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  };
}

// ─── Credit Card Payment ─────────────────────────────────────────────────────

export interface CardPaymentInput {
  orderId: number;
  orderNumber: string;
  amount: number;
  token: string; // tokenized card from MP.js frontend
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
  payerEmail: string;
  payerName: string;
  payerCpf?: string;
  accessToken?: string;
}

export interface CardPaymentResult {
  paymentId: string;
  status: string;
  statusDetail: string;
  installments: number;
  lastFourDigits?: string;
}

export async function createCardPayment(
  input: CardPaymentInput
): Promise<CardPaymentResult> {
  const client = getMPClient(input.accessToken);
  const payment = new Payment(client);

  const body = {
    transaction_amount: input.amount,
    token: input.token,
    description: `Pedido #${input.orderNumber} - Gráfica Maria Imprime`,
    installments: input.installments,
    payment_method_id: input.paymentMethodId,
    issuer_id: input.issuerId ? Number(input.issuerId) : undefined,
    payer: {
      email: input.payerEmail,
      first_name: input.payerName.split(" ")[0] || input.payerName,
      last_name: input.payerName.split(" ").slice(1).join(" ") || "",
      identification: input.payerCpf
        ? { type: "CPF", number: input.payerCpf.replace(/\D/g, "") }
        : undefined,
    },
    external_reference: String(input.orderId),
    notification_url: `${process.env.APP_BASE_URL || ""}/api/payments/mercadopago/webhook`,
  };

  const result = await payment.create({ body });

  if (!result.id) {
    throw new Error("Falha ao criar pagamento com cartão no Mercado Pago");
  }

  return {
    paymentId: String(result.id),
    status: result.status || "pending",
    statusDetail: result.status_detail || "",
    installments: result.installments || input.installments,
    lastFourDigits: result.card?.last_four_digits,
  };
}

// ─── Payment Status ──────────────────────────────────────────────────────────

export async function getPaymentStatus(
  paymentId: string,
  accessToken?: string
): Promise<{ status: string; statusDetail: string }> {
  const client = getMPClient(accessToken);
  const payment = new Payment(client);
  const result = await payment.get({ id: paymentId });
  return {
    status: result.status || "unknown",
    statusDetail: result.status_detail || "",
  };
}
