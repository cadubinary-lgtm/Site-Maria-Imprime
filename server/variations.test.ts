import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("variations router", () => {
  it("should get variations by product", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Testar com um produto que deve ter variações
    const result = await caller.variations.getByProduct({ productId: 90014 });

    // Deve retornar um array (pode estar vazio se o produto não tem variações)
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow admin to create variation type", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminVariations.createType({
      productId: 90014,
      type: "material",
      name: "Material Test",
      isRequired: true,
    });

    // Deve retornar um resultado com insertId
    expect(result).toBeDefined();
  });

  it("should allow admin to create variation option", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Usar um tipo de variacao existente (ID 1 eh o tipo de material criado pelo seed)
    const optionResult = await caller.adminVariations.createOption({
      variationTypeId: 1,
      name: "Option Test",
      description: "Test option",
      priceModifier: "50.00",
    });

    expect(optionResult).toBeDefined();
  });

  it("should create file check", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.fileCheck.create({
      orderItemId: 1,
      fileName: "test-file.pdf",
      fileSize: 1024,
    });

    expect(result).toBeDefined();
  });

  it("should get file check by order item", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.fileCheck.getByOrderItem({ orderItemId: 1 });

    // Pode retornar undefined se não houver checagem
    expect(result === undefined || result !== null).toBe(true);
  });
});
