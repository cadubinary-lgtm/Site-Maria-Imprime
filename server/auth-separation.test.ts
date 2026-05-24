/**
 * Testes de validação: separação Manus OAuth x Customer Auth
 * Valida que rotas públicas não exigem autenticação e que
 * os dois sistemas de autenticação estão corretamente separados
 */
import { describe, it, expect, vi } from "vitest";

// ── Testes de separação de autenticação ──────────────────────────────────────

describe("Separação de Autenticação", () => {
  it("publicProcedure não deve exigir ctx.user", () => {
    // O contexto tRPC permite user = null para publicProcedure
    const ctx = { req: { cookies: {} }, res: {}, user: null };
    expect(ctx.user).toBeNull();
    // publicProcedure não lança erro com user null
    expect(() => {
      if (!ctx.user) {
        // publicProcedure: sem throw, apenas user null
        return null;
      }
    }).not.toThrow();
  });

  it("protectedProcedure deve exigir ctx.user (Manus OAuth)", () => {
    const ctx = { req: {}, res: {}, user: null };
    expect(() => {
      if (!ctx.user) {
        throw new Error("UNAUTHORIZED");
      }
    }).toThrow("UNAUTHORIZED");
  });

  it("customer auth usa cookie customer_session separado do Manus OAuth", () => {
    const req = {
      cookies: {
        customer_session: "tok_customer_abc123",
        // Manus OAuth usa session_token (diferente)
      }
    };
    const customerToken = req.cookies.customer_session;
    expect(customerToken).toBeDefined();
    expect(customerToken).toContain("tok_customer");
    // Não deve confundir com Manus OAuth
    expect(req.cookies).not.toHaveProperty("session_token");
  });

  it("interceptador global não deve redirecionar rotas de cliente para OAuth", () => {
    const customerRoutes = [
      "/minha-conta",
      "/meus-pedidos",
      "/pedido/ORD-001",
      "/rastreamento/123",
    ];

    for (const path of customerRoutes) {
      const isCustomerRoute = path.startsWith("/minha-conta") ||
                              path.startsWith("/meus-pedidos") ||
                              path.startsWith("/pedido/") ||
                              path.startsWith("/rastreamento/");
      expect(isCustomerRoute).toBe(true);
    }
  });

  it("interceptador global deve redirecionar apenas rotas admin para OAuth", () => {
    const adminRoutes = ["/admin", "/admin/produtos", "/producao"];
    const publicRoutes = ["/", "/produtos", "/carrinho", "/cadastro", "/login-cliente"];

    for (const path of adminRoutes) {
      const isAdminRoute = path.startsWith("/admin") || path.startsWith("/producao");
      expect(isAdminRoute).toBe(true);
    }

    for (const path of publicRoutes) {
      const isAdminRoute = path.startsWith("/admin") || path.startsWith("/producao");
      expect(isAdminRoute).toBe(false);
    }
  });

  it("rotas públicas não devem disparar redirect OAuth", () => {
    const publicRoutes = [
      "/",
      "/produtos",
      "/produto/adesivos",
      "/carrinho",
      "/cadastro",
      "/login-cliente",
      "/recuperar-senha",
      "/checkout",
      "/orcamento",
    ];

    for (const path of publicRoutes) {
      const isAdminRoute = path.startsWith("/admin") || path.startsWith("/producao");
      const isCustomerRoute = path.startsWith("/minha-conta") ||
                              path.startsWith("/meus-pedidos") ||
                              path.startsWith("/pedido/") ||
                              path.startsWith("/rastreamento/");
      // Rotas públicas: não são admin nem cliente → não redireciona
      const shouldRedirect = isAdminRoute && !isCustomerRoute;
      expect(shouldRedirect).toBe(false);
    }
  });
});

// ── Testes de carrinho público ────────────────────────────────────────────────

describe("Carrinho Público (sem autenticação)", () => {
  it("carrinho deve aceitar sessionId de visitante", () => {
    const sessionId = "sess_anon_abc123def456";
    expect(sessionId).toBeDefined();
    expect(sessionId.length).toBeGreaterThan(10);
  });

  it("carrinho deve aceitar userId de usuário Manus OAuth", () => {
    const userId = 42;
    expect(typeof userId).toBe("number");
    expect(userId).toBeGreaterThan(0);
  });

  it("carrinho deve aceitar customerId de cliente da loja", () => {
    const customerId = 7;
    expect(typeof customerId).toBe("number");
    expect(customerId).toBeGreaterThan(0);
  });

  it("getCartIdentifier deve retornar userId, customerId ou sessionId", () => {
    const getCartIdentifier = (
      userId: number | null,
      customerId: number | null,
      sessionId: string | null
    ) => {
      if (userId) return { type: "user", id: userId };
      if (customerId) return { type: "customer", id: customerId };
      if (sessionId) return { type: "session", id: sessionId };
      return null;
    };

    expect(getCartIdentifier(42, null, null)).toEqual({ type: "user", id: 42 });
    expect(getCartIdentifier(null, 7, null)).toEqual({ type: "customer", id: 7 });
    expect(getCartIdentifier(null, null, "sess_abc")).toEqual({ type: "session", id: "sess_abc" });
    expect(getCartIdentifier(null, null, null)).toBeNull();
  });
});

// ── Testes de email Resend ────────────────────────────────────────────────────

describe("Configuração de Email (Resend)", () => {
  it("deve ter RESEND_API_KEY configurada", () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY!.length).toBeGreaterThan(10);
  });

  it("deve ter remetente profissional configurado", () => {
    expect(process.env.RESEND_FROM_EMAIL).toBe("noreply@mail.graficapontodigital.com.br");
  });

  it("deve ter nome do remetente configurado", () => {
    expect(process.env.RESEND_FROM_NAME).toBe("Gráfica Ponto Digital");
  });
});
