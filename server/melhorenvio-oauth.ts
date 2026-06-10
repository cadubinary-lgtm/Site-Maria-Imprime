/**
 * Melhor Envio OAuth2 Service
 * Implementa o fluxo completo de autenticação OAuth2 com o Melhor Envio:
 * - Geração da URL de autorização
 * - Troca do Authorization Code por Access Token + Refresh Token
 * - Renovação automática do Access Token via Refresh Token
 * - Verificação de status da conexão
 *
 * Documentação: https://docs.melhorenvio.com.br/docs/autenticacao
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { carriers } from "../drizzle/schema";

// Endpoints do Melhor Envio
const ME_PRODUCTION_BASE = "https://melhorenvio.com.br";
const ME_SANDBOX_BASE = "https://sandbox.melhorenvio.com.br";

// Validades dos tokens (em ms)
const ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const REFRESH_TOKEN_TTL_MS = 45 * 24 * 60 * 60 * 1000; // 45 dias

// Scopes necessários para a integração
const REQUIRED_SCOPES = [
  "cart-read",
  "cart-write",
  "companies-read",
  "companies-write",
  "coupons-read",
  "coupons-write",
  "notifications-read",
  "orders-read",
  "products-read",
  "products-write",
  "purchases-read",
  "shipping-calculate",
  "shipping-cancel",
  "shipping-checkout",
  "shipping-companies",
  "shipping-generate",
  "shipping-preview",
  "shipping-print",
  "shipping-share",
  "shipping-tracking",
  "ecommerce-shipping",
  "logistics-read",
  "users-read",
  "users-write",
].join(" ");

export type MelhorEnvioConnectionStatus =
  | "not_connected"
  | "connected"
  | "token_expired"
  | "refresh_token_expired"
  | "auth_error";

export interface MelhorEnvioStatusResult {
  status: MelhorEnvioConnectionStatus;
  connectedAt?: number;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
  message: string;
}

/**
 * Gera a URL de autorização OAuth2 do Melhor Envio
 */
export function generateAuthorizationUrl(params: {
  clientId: string;
  redirectUri: string;
  sandbox?: boolean;
  state?: string;
}): string {
  const base = params.sandbox ? ME_SANDBOX_BASE : ME_PRODUCTION_BASE;
  const url = new URL(`${base}/oauth/authorize`);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", REQUIRED_SCOPES);
  if (params.state) {
    url.searchParams.set("state", params.state);
  }
  return url.toString();
}

/**
 * Troca o Authorization Code por Access Token + Refresh Token
 */
export async function exchangeCodeForTokens(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sandbox?: boolean;
}): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}> {
  const base = params.sandbox ? ME_SANDBOX_BASE : ME_PRODUCTION_BASE;
  const response = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "GraficaPontoDigital/1.0 (mariaimprime.com.br)",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
      code: params.code,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Melhor Envio token exchange failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`Melhor Envio: access_token não retornado. Resposta: ${JSON.stringify(data)}`);
  }
  return data;
}

/**
 * Renova o Access Token usando o Refresh Token
 */
export async function refreshAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  sandbox?: boolean;
}): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}> {
  const base = params.sandbox ? ME_SANDBOX_BASE : ME_PRODUCTION_BASE;
  const response = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "GraficaPontoDigital/1.0 (mariaimprime.com.br)",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
      refresh_token: params.refreshToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Melhor Envio token refresh failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`Melhor Envio: access_token não retornado no refresh. Resposta: ${JSON.stringify(data)}`);
  }
  return data;
}

/**
 * Salva os tokens no banco de dados para uma transportadora específica
 */
export async function saveTokensToCarrier(
  carrierId: number,
  tokens: { access_token: string; refresh_token: string; expires_in?: number }
): Promise<void> {
  const db = (await getDb())!;
  const now = Date.now();
  const accessTokenExpiresAt = now + ACCESS_TOKEN_TTL_MS;
  const refreshTokenExpiresAt = now + REFRESH_TOKEN_TTL_MS;

  await db
    .update(carriers)
    .set({
      melhorEnvioAccessToken: tokens.access_token,
      melhorEnvioRefreshToken: tokens.refresh_token,
      melhorEnvioAccessTokenExpiresAt: accessTokenExpiresAt,
      melhorEnvioRefreshTokenExpiresAt: refreshTokenExpiresAt,
      melhorEnvioConnectedAt: now,
    })
    .where(eq(carriers.id, carrierId));
}

/**
 * Verifica o status da conexão com o Melhor Envio para uma transportadora
 */
export function getConnectionStatus(carrier: {
  melhorEnvioAccessToken?: string | null;
  melhorEnvioRefreshToken?: string | null;
  melhorEnvioAccessTokenExpiresAt?: number | null;
  melhorEnvioRefreshTokenExpiresAt?: number | null;
  melhorEnvioConnectedAt?: number | null;
}): MelhorEnvioStatusResult {
  const now = Date.now();
  const BUFFER_MS = 5 * 60 * 1000; // 5 minutos de buffer antes de expirar

  if (!carrier.melhorEnvioAccessToken || !carrier.melhorEnvioRefreshToken) {
    return {
      status: "not_connected",
      message: "Não conectado ao Melhor Envio. Clique em 'Conectar ao Melhor Envio' para autorizar.",
    };
  }

  // Verificar se o refresh token expirou
  if (
    carrier.melhorEnvioRefreshTokenExpiresAt &&
    now > carrier.melhorEnvioRefreshTokenExpiresAt - BUFFER_MS
  ) {
    return {
      status: "refresh_token_expired",
      connectedAt: carrier.melhorEnvioConnectedAt ?? undefined,
      refreshTokenExpiresAt: carrier.melhorEnvioRefreshTokenExpiresAt ?? undefined,
      message: "Sessão expirada. É necessário reconectar ao Melhor Envio.",
    };
  }

  // Verificar se o access token expirou (mas refresh token ainda é válido)
  if (
    carrier.melhorEnvioAccessTokenExpiresAt &&
    now > carrier.melhorEnvioAccessTokenExpiresAt - BUFFER_MS
  ) {
    return {
      status: "token_expired",
      connectedAt: carrier.melhorEnvioConnectedAt ?? undefined,
      accessTokenExpiresAt: carrier.melhorEnvioAccessTokenExpiresAt ?? undefined,
      refreshTokenExpiresAt: carrier.melhorEnvioRefreshTokenExpiresAt ?? undefined,
      message: "Access token expirado. Renovando automaticamente...",
    };
  }

  return {
    status: "connected",
    connectedAt: carrier.melhorEnvioConnectedAt ?? undefined,
    accessTokenExpiresAt: carrier.melhorEnvioAccessTokenExpiresAt ?? undefined,
    refreshTokenExpiresAt: carrier.melhorEnvioRefreshTokenExpiresAt ?? undefined,
    message: "Conectado ao Melhor Envio com sucesso.",
  };
}

/**
 * Obtém um access token válido para uma transportadora,
 * renovando automaticamente se necessário
 */
export async function getValidAccessToken(carrierId: number): Promise<string | null> {
  const db = (await getDb())!;
  const carrier = await (db as any).query.carriers.findFirst({
    where: eq(carriers.id, carrierId),
  });

  if (!carrier) return null;

  const status = getConnectionStatus(carrier);

  if (status.status === "connected") {
    return carrier.melhorEnvioAccessToken ?? null;
  }

  if (status.status === "token_expired" && carrier.melhorEnvioRefreshToken) {
    // Tentar renovar o access token
    try {
      const newTokens = await refreshAccessToken({
        refreshToken: carrier.melhorEnvioRefreshToken,
        clientId: carrier.melhorEnvioClientId ?? "",
        clientSecret: carrier.melhorEnvioClientSecret ?? "",
        redirectUri: carrier.melhorEnvioRedirectUri ?? "",
        sandbox: carrier.melhorEnvioSandbox ?? false,
      });
      await saveTokensToCarrier(carrierId, newTokens);
      return newTokens.access_token;
    } catch (err) {
      console.error(`[MelhorEnvio] Falha ao renovar token para carrier ${carrierId}:`, err);
      return null;
    }
  }

  return null;
}
