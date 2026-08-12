import { describe, expect, it, vi } from "vitest";
import { applySecurityHeaders, enforceHttpsInProduction } from "./_core/security";

function makeResponse() {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
    redirect: vi.fn(),
  };
  return res as any;
}

describe("proteção HTTPS e cabeçalhos", () => {
  it("redireciona tráfego HTTP encaminhado em produção para HTTPS", () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const next = vi.fn();
    const res = makeResponse();
    const req = {
      get: (name: string) => ({ "x-forwarded-proto": "http", host: "mariaimprime.com.br" }[name] || null),
      originalUrl: "/login?return=%2Fminha-conta",
    } as any;

    enforceHttpsInProduction(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(308, "https://mariaimprime.com.br/login?return=%2Fminha-conta");
    expect(next).not.toHaveBeenCalled();
    process.env.NODE_ENV = previousEnv;
  });

  it("preserva requisições HTTPS e o ambiente local", () => {
    const next = vi.fn();
    const res = makeResponse();
    const req = { get: () => "https", originalUrl: "/" } as any;

    enforceHttpsInProduction(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("aplica cabeçalhos essenciais de segurança", () => {
    const next = vi.fn();
    const res = makeResponse();

    applySecurityHeaders({} as any, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    expect(res.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    expect(res.setHeader).toHaveBeenCalledWith("Referrer-Policy", "strict-origin-when-cross-origin");
    expect(next).toHaveBeenCalledOnce();
  });
});
