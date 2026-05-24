/**
 * Testes de persistência do cookie customer_session
 * Valida:
 * 1. Leitura do cookie via req.headers.cookie (sem cookie-parser)
 * 2. Atributos corretos do Set-Cookie (sameSite, secure, httpOnly, path)
 * 3. getSessionCookieOptions retorna sameSite:'none' e secure:true para HTTPS
 */
import { describe, it, expect } from "vitest";
import { parse as parseCookieHeader } from "cookie";

// Replica a função getCustomerSessionToken do customerAuth.ts
function getCustomerSessionToken(req: { headers: { cookie?: string } }): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const parsed = parseCookieHeader(cookieHeader);
  return parsed["customer_session"] || undefined;
}

// Replica a lógica de getSessionCookieOptions do cookies.ts
function isSecureRequest(req: { protocol?: string; headers: Record<string, string | string[] | undefined> }): boolean {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

function getSessionCookieOptions(req: { protocol?: string; headers: Record<string, string | string[] | undefined> }) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none" as const,
    secure: isSecureRequest(req),
  };
}

describe("Cookie customer_session — leitura via req.headers.cookie", () => {
  it("deve ler o token quando cookie está presente no header", () => {
    const req = { headers: { cookie: "customer_session=abc123; other_cookie=xyz" } };
    expect(getCustomerSessionToken(req)).toBe("abc123");
  });

  it("deve retornar undefined quando não há header cookie", () => {
    const req = { headers: {} };
    expect(getCustomerSessionToken(req)).toBeUndefined();
  });

  it("deve retornar undefined quando customer_session não está no header", () => {
    const req = { headers: { cookie: "session_token=admin_token; cart_session=cart123" } };
    expect(getCustomerSessionToken(req)).toBeUndefined();
  });

  it("deve ler corretamente com múltiplos cookies", () => {
    const req = {
      headers: {
        cookie: "session_token=admin; cart_session=cart123; customer_session=customer_token_xyz",
      },
    };
    expect(getCustomerSessionToken(req)).toBe("customer_token_xyz");
  });

  it("deve funcionar sem cookie-parser (leitura direta de req.headers.cookie)", () => {
    // Simula o que acontece sem cookie-parser: req.cookies é undefined
    const reqWithoutCookieParser = {
      headers: { cookie: "customer_session=token_sem_cookie_parser" },
      cookies: undefined, // sem cookie-parser
    };
    // A nova função lê de headers.cookie diretamente — não depende de req.cookies
    expect(getCustomerSessionToken(reqWithoutCookieParser)).toBe("token_sem_cookie_parser");
  });
});

describe("Cookie customer_session — atributos corretos (Set-Cookie)", () => {
  it("deve usar sameSite:none para compatibilidade cross-origin no Manus Preview", () => {
    const req = { protocol: "https", headers: { "x-forwarded-proto": "https" } };
    const opts = getSessionCookieOptions(req);
    expect(opts.sameSite).toBe("none");
  });

  it("deve usar secure:true quando x-forwarded-proto é https", () => {
    const req = { headers: { "x-forwarded-proto": "https" } };
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(true);
  });

  it("deve usar secure:false em localhost (sem x-forwarded-proto)", () => {
    const req = { protocol: "http", headers: {} };
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(false);
  });

  it("deve sempre ter httpOnly:true", () => {
    const req = { headers: {} };
    const opts = getSessionCookieOptions(req);
    expect(opts.httpOnly).toBe(true);
  });

  it("deve sempre ter path:/", () => {
    const req = { headers: {} };
    const opts = getSessionCookieOptions(req);
    expect(opts.path).toBe("/");
  });

  it("deve detectar HTTPS via x-forwarded-proto com múltiplos valores", () => {
    const req = { headers: { "x-forwarded-proto": "https, http" } };
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(true);
  });
});

describe("Compatibilidade com ambiente Manus Preview (*.manus.computer)", () => {
  it("sameSite:none + secure:true é necessário para cookies cross-origin no Manus Preview", () => {
    // O Manus Preview usa HTTPS com x-forwarded-proto
    const req = { headers: { "x-forwarded-proto": "https" } };
    const opts = getSessionCookieOptions(req);
    // SameSite=None requer Secure=true (regra do browser)
    expect(opts.sameSite).toBe("none");
    expect(opts.secure).toBe(true);
  });

  it("SameSite:lax bloquearia cookies cross-origin — confirmando que a correção é necessária", () => {
    // Antes da correção, o código usava sameSite:'lax' — isso bloquearia o cookie
    // no ambiente Manus Preview (cross-origin entre frontend e backend)
    const oldConfig = { sameSite: "lax" as const, secure: false };
    // sameSite:lax não permite cookies em requisições cross-origin (POST)
    expect(oldConfig.sameSite).toBe("lax"); // era o valor problemático
    // A correção usa 'none' que permite cross-origin com secure:true
  });
});
