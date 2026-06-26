/**
 * Mercado Pago Integration Helper
 * Handles PIX and Credit Card payments via MP SDK v3
 *
 * Changelog:
 * - Higienização absoluta do payer (CPF/CNPJ limpo, email trimado, first_name obrigatório)
 * - try/catch com log detalhado da resposta da API em caso de erro
 * - Recriação do client quando o token muda (resetMPClient)
 */
import MercadoPagoConfig, { Payment } from "mercadopago";

// Lazy-initialized client — credentials come from DB settings or env
let _client: MercadoPagoConfig | null = null;
let _lastToken: string | null = null;

export function getMPClient(accessToken?: string): MercadoPagoConfig {
  const token = accessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  if (!token) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não configurado. Configure nas Configurações do Admin."
    );
  }
  // Re-create client whenever the token changes
  if (!_client || _lastToken !== token) {
    _client = new MercadoPagoConfig({ accessToken: token });
    _lastToken = token;
  }
  return _client;
}

export function resetMPClient() {
  _client = null;
  _lastToken = null;
}

// ─── Helpers de higienização ─────────────────────────────────────────────────

/** Remove tudo que não for dígito de um CPF/CNPJ */
function cleanDocument(doc?: string): string {
  return (doc || "").replace(/\D/g, "");
}

/** Extrai o primeiro nome limpo de uma string de nome completo */
function extractFirstName(fullName: string): string {
  return (fullName || "").trim().split(/\s+/)[0] || "Cliente";
}

/** Extrai o sobrenome (tudo após o primeiro nome) */
function extractLastName(fullName: string): string {
  const parts = (fullName || "").trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

/** Valida e normaliza o e-mail do pagador */
function sanitizeEmail(email: string): string {
  const trimmed = (email || "").trim().toLowerCase();
  // Fallback para e-mail genérico se inválido (evita rejeição da API)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : "pagador@mariaimprime.com.br";
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

  // ── Higienização absoluta do payer ──────────────────────────────────────
  const cleanEmail = sanitizeEmail(input.payerEmail);
  const cleanFirstName = extractFirstName(input.payerName);
  const cleanLastName = extractLastName(input.payerName);
  const cleanCpf = cleanDocument(input.payerCpf);

  const body = {
    transaction_amount: Number(input.amount.toFixed(2)),
    description: `Pedido #${input.orderNumber} - Grafica Maria Imprime`,
    payment_method_id: "pix",
    payer: {
      email: cleanEmail,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      ...(cleanCpf.length >= 11
        ? {
            identification: {
              type: cleanCpf.length === 14 ? "CNPJ" : "CPF",
              number: cleanCpf,
            },
          }
        : {}),
    },
    external_reference: String(input.orderId),
    notification_url: `${process.env.APP_BASE_URL || ""}/api/payments/mercadopago/webhook`,
  };

  console.log("[MP PIX] Enviando payload:", JSON.stringify(body, null, 2));

  try {
    const result = await payment.create({ body });

    console.log("[MP PIX] Resposta da API:", JSON.stringify({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
    }, null, 2));

    if (!result.id) {
      throw new Error("Falha ao criar pagamento PIX: API não retornou ID");
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
  } catch (error: any) {
    // Log detalhado para expor o motivo exato da rejeição pela API
    console.error("[MP PIX] Erro detalhado MP:", error?.response?.data || error?.cause || error?.message || error);
    if (error?.response?.data?.message) {
      throw new Error(`Mercado Pago: ${error.response.data.message}`);
    }
    if (error?.cause) {
      const causes = Array.isArray(error.cause)
        ? error.cause.map((c: any) => `${c.code}: ${c.description}`).join("; ")
        : String(error.cause);
      throw new Error(`Mercado Pago: ${causes}`);
    }
    throw error;
  }
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

  // ── Higienização absoluta do payer ──────────────────────────────────────
  const cleanEmail = sanitizeEmail(input.payerEmail);
  const cleanFirstName = extractFirstName(input.payerName);
  const cleanLastName = extractLastName(input.payerName);
  const cleanCpf = cleanDocument(input.payerCpf);

  const body = {
    transaction_amount: Number(input.amount.toFixed(2)),
    token: input.token,
    description: `Pedido #${input.orderNumber} - Grafica Maria Imprime`,
    installments: input.installments,
    payment_method_id: input.paymentMethodId,
    issuer_id: input.issuerId ? Number(input.issuerId) : undefined,
    payer: {
      email: cleanEmail,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      ...(cleanCpf.length >= 11
        ? {
            identification: {
              type: cleanCpf.length === 14 ? "CNPJ" : "CPF",
              number: cleanCpf,
            },
          }
        : {}),
    },
    external_reference: String(input.orderId),
    notification_url: `${process.env.APP_BASE_URL || ""}/api/payments/mercadopago/webhook`,
  };

  console.log("[MP CARD] Enviando payload:", JSON.stringify({ ...body, token: "***" }, null, 2));

  try {
    const result = await payment.create({ body });

    console.log("[MP CARD] Resposta da API:", JSON.stringify({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
    }, null, 2));

    if (!result.id) {
      throw new Error("Falha ao criar pagamento com cartão: API não retornou ID");
    }

    return {
      paymentId: String(result.id),
      status: result.status || "pending",
      statusDetail: result.status_detail || "",
      installments: result.installments || input.installments,
      lastFourDigits: result.card?.last_four_digits,
    };
  } catch (error: any) {
    console.error("[MP CARD] Erro detalhado MP:", error?.response?.data || error?.cause || error?.message || error);
    if (error?.response?.data?.message) {
      throw new Error(`Mercado Pago: ${error.response.data.message}`);
    }
    if (error?.cause) {
      const causes = Array.isArray(error.cause)
        ? error.cause.map((c: any) => `${c.code}: ${c.description}`).join("; ")
        : String(error.cause);
      throw new Error(`Mercado Pago: ${causes}`);
    }
    throw error;
  }
}

// ─── Payment Status ──────────────────────────────────────────────────────────

export async function getPaymentStatus(
  paymentId: string,
  accessToken?: string
): Promise<{ status: string; statusDetail: string }> {
  const client = getMPClient(accessToken);
  const payment = new Payment(client);

  try {
    const result = await payment.get({ id: paymentId });
    return {
      status: result.status || "unknown",
      statusDetail: result.status_detail || "",
    };
  } catch (error: any) {
    console.error("[MP STATUS] Erro ao consultar pagamento:", error?.response?.data || error?.message || error);
    throw error;
  }
}
