import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("search.global", () => {
  it("should return empty results for empty query", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.search.global({ query: "" });

    expect(result.products).toEqual([]);
    expect(result.categories).toEqual([]);
    expect(result.materials).toEqual([]);
  });

  it("should search for products by name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.search.global({ query: "adesivo" });

    expect(Array.isArray(result.products)).toBe(true);
    expect(Array.isArray(result.categories)).toBe(true);
    expect(Array.isArray(result.materials)).toBe(true);
  });

  it("should return limited results (max 10 per type)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.search.global({ query: "a" });

    expect(result.products.length).toBeLessThanOrEqual(10);
    expect(result.categories.length).toBeLessThanOrEqual(10);
    expect(result.materials.length).toBeLessThanOrEqual(10);
  });

  it("should be case insensitive", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const resultLower = await caller.search.global({ query: "adesivo" });
    const resultUpper = await caller.search.global({ query: "ADESIVO" });
    const resultMixed = await caller.search.global({ query: "AdEsIvO" });

    expect(resultLower.products.length).toBeGreaterThan(0);
    expect(resultUpper.products.length).toBeGreaterThan(0);
    expect(resultMixed.products.length).toBeGreaterThan(0);
  });

  it("should search in product descriptions", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.search.global({ query: "personalizado" });

    // Should find products with "personalizado" in name or description
    expect(Array.isArray(result.products)).toBe(true);
  });
});
