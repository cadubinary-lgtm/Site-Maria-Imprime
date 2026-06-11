/**
 * Melhor Envio API v2 — Cliente HTTP
 *
 * Documentação: https://docs.melhorenvio.com.br/
 * Sandbox:      https://sandbox.melhorenvio.com.br
 * Produção:     https://api.melhorenvio.com.br
 */

const SANDBOX_BASE = "https://sandbox.melhorenvio.com.br";
const PRODUCTION_BASE = "https://api.melhorenvio.com.br";

export function getMeBaseUrl(sandbox: boolean): string {
  return sandbox ? SANDBOX_BASE : PRODUCTION_BASE;
}

interface MeRequestOptions {
  token: string;
  sandbox: boolean;
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

async function meRequest<T>(opts: MeRequestOptions): Promise<T> {
  const base = getMeBaseUrl(opts.sandbox);
  const url = `${base}${opts.path}`;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GraficaPontoDigital/1.0 (contato@mariaimprime.com.br)",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let errMsg = `Melhor Envio API error ${res.status}`;
    try {
      const errBody = await res.json();
      errMsg = errBody?.message ?? errBody?.error ?? errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos da API
// ─────────────────────────────────────────────────────────────────────────────

export interface MeCompany {
  id: number;
  name: string;
  status: string;
  picture: string; // URL do logo
}

export interface MeService {
  id: number;
  name: string;
  status: string;
  type: string;
  range: { min: number; max: number };
  restrictions: { insurance_value: { min: number; max: number }; formats: string[] };
  company: MeCompany;
}

export interface MeShippingQuote {
  id: number;
  name: string;
  price: string;
  custom_price: string;
  discount: string;
  currency: string;
  delivery_time: number;
  delivery_range: { min: number; max: number };
  custom_delivery_time: number;
  custom_delivery_range: { min: number; max: number };
  packages: unknown[];
  additional_services: unknown;
  company: MeCompany;
  error?: string;
}

export interface MeCartItem {
  name: string;
  service: number; // ID do serviço
  from: {
    name: string;
    phone: string;
    email: string;
    document: string;
    company_document?: string;
    address: string;
    complement?: string;
    number: string;
    district: string;
    city: string;
    country_id: string;
    postal_code: string;
    state_abbr: string;
  };
  to: {
    name: string;
    phone: string;
    email: string;
    document: string;
    address: string;
    complement?: string;
    number: string;
    district: string;
    city: string;
    country_id: string;
    postal_code: string;
    state_abbr: string;
  };
  products: Array<{
    name: string;
    quantity: number;
    unitary_value: number;
  }>;
  volumes: Array<{
    height: number;
    width: number;
    length: number;
    weight: number;
  }>;
  options?: {
    insurance_value?: number;
    receipt?: boolean;
    own_hand?: boolean;
    reverse?: boolean;
    non_commercial?: boolean;
    invoice?: { key: string };
    platform?: string;
    tags?: Array<{ tag: string; url?: string }>;
  };
}

export interface MeCartResponse {
  id: string;
  protocol: string;
  service_id: number;
  agency: number | null;
  contract: string | null;
  service_code: string | null;
  quote: number;
  price: number;
  coupon: string | null;
  discount: number;
  delivery_min: number;
  delivery_max: number;
  status: string;
  reminder: string | null;
  insurance_value: number;
  weight: number | null;
  width: number | null;
  height: number | null;
  length: number | null;
  diameter: number | null;
  format: string;
  billed_weight: number;
  receipt: boolean;
  own_hand: boolean;
  collect: boolean;
  collect_scheduled_at: string | null;
  reverse: boolean;
  non_commercial: boolean;
  authorization_code: string | null;
  tracking: string | null;
  self_tracking: string | null;
  delivery_receipt: string | null;
  additional_info: string | null;
  cte_key: string | null;
  paid: boolean;
  generated: boolean;
  print_url: string | null;
  canceled_at: string | null;
  suspended_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
  parse_pi_errors: unknown[];
  from: unknown;
  to: unknown;
  service: unknown;
  agency_object: unknown | null;
  volumes: unknown[];
  tags: unknown[];
  products: unknown[];
  generated_key: string | null;
}

export interface MeCheckoutResponse {
  purchase: {
    id: string;
    protocol: string;
    total: number;
    discount: number;
    status: string;
    paid_at: string;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
    payment: unknown;
    orders: MeCartResponse[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções da API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna o perfil do usuário autenticado
 * GET /api/v2/me
 */
export async function getMeProfile(token: string, sandbox: boolean) {
  return meRequest<{ id: number; firstname: string; lastname: string; email: string }>({
    token,
    sandbox,
    path: "/api/v2/me",
  });
}

/**
 * Lista as empresas de transporte disponíveis
 * GET /api/v2/me/shipment/companies
 */
export async function listShipmentCompanies(token: string, sandbox: boolean): Promise<MeCompany[]> {
  return meRequest<MeCompany[]>({
    token,
    sandbox,
    path: "/api/v2/me/shipment/companies",
  });
}

/**
 * Calcula opções de frete
 * POST /api/v2/me/shipment/calculate
 */
export interface CalculateShippingInput {
  from: { postal_code: string };
  to: { postal_code: string };
  package: {
    height: number;
    width: number;
    length: number;
    weight: number;
  };
  options?: {
    insurance_value?: number;
    receipt?: boolean;
    own_hand?: boolean;
    collect?: boolean;
    reverse?: boolean;
    non_commercial?: boolean;
    invoice?: { key: string };
  };
  services?: string; // IDs separados por vírgula, ex: "1,2,3"
}

export async function calculateShipping(
  token: string,
  sandbox: boolean,
  input: CalculateShippingInput
): Promise<MeShippingQuote[]> {
  return meRequest<MeShippingQuote[]>({
    token,
    sandbox,
    path: "/api/v2/me/shipment/calculate",
    method: "POST",
    body: input,
  });
}

/**
 * Adiciona etiqueta ao carrinho do Melhor Envio
 * POST /api/v2/me/cart
 */
export async function addToCart(
  token: string,
  sandbox: boolean,
  item: MeCartItem
): Promise<MeCartResponse> {
  return meRequest<MeCartResponse>({
    token,
    sandbox,
    path: "/api/v2/me/cart",
    method: "POST",
    body: item,
  });
}

/**
 * Realiza o checkout (pagamento) das etiquetas no carrinho
 * POST /api/v2/me/shipment/checkout
 */
export async function checkoutShipment(
  token: string,
  sandbox: boolean,
  orderIds: string[]
): Promise<MeCheckoutResponse> {
  return meRequest<MeCheckoutResponse>({
    token,
    sandbox,
    path: "/api/v2/me/shipment/checkout",
    method: "POST",
    body: { orders: orderIds },
  });
}

/**
 * Gera a URL de impressão da etiqueta
 * POST /api/v2/me/shipment/print
 */
export async function printLabel(
  token: string,
  sandbox: boolean,
  orderIds: string[],
  mode: "private" | "public" = "private"
): Promise<{ url: string }> {
  return meRequest<{ url: string }>({
    token,
    sandbox,
    path: "/api/v2/me/shipment/print",
    method: "POST",
    body: { mode, orders: orderIds },
  });
}

/**
 * Rastreia um envio pelo código de rastreamento
 * GET /api/v2/me/orders/tracking?q=CÓDIGO
 */
export async function trackShipment(
  token: string,
  sandbox: boolean,
  trackingCode: string
): Promise<unknown> {
  return meRequest<unknown>({
    token,
    sandbox,
    path: `/api/v2/me/orders/tracking?q=${encodeURIComponent(trackingCode)}`,
  });
}
