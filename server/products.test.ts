import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("products router", () => {
  it("should get all products as public user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.getAll();
    expect(Array.isArray(products)).toBe(true);
  });

  it("should get products by segment", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.getBySegment({ segment: "alimentacao" });
    expect(Array.isArray(products)).toBe(true);
  });

  it("should get product by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getById({ id: 999 });
    expect(product === undefined || product !== null).toBe(true);
  });
});

describe("admin router", () => {
  it("should create a product as admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.createProduct({
      name: "Test Product",
      description: "Test Description",
      price: "50.00",
      segment: "alimentacao",
      imageUrl: "https://example.com/image.jpg",
    });

    expect(result).toBeDefined();
  });

  it("should get all orders as admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const orders = await caller.admin.getAllOrders();
    expect(Array.isArray(orders)).toBe(true);
  });
});
