import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { products, shippingRules, carriers } from "../drizzle/schema";

describe("Shipping Methods Calculation - Debug", () => {
  let db: any;

  beforeAll(() => {
    db = getDb();
  });

  it("should find products with shipping configurations", async () => {
    const prods = await db.query.products.findMany({
      limit: 5,
    });
    
    console.log("Products found:", prods.length);
    prods.forEach((p: any) => {
      console.log(`- ${p.name}: weight=${p.weight}, allowPickup=${p.allowPickup}, allowMotoExpress=${p.allowMotoExpress}`);
    });
    
    expect(prods.length).toBeGreaterThan(0);
  });

  it("should find shipping rules for Moto Express", async () => {
    const rules = await db.query.shippingRules.findMany({
      where: (rules: any, { eq }: any) => eq(rules.carrierId, 0),
    });
    
    console.log("Moto Express rules found:", rules.length);
    rules.forEach((r: any) => {
      console.log(`- ${r.name}: price=${r.basePrice}, days=${r.estimatedDays}`);
    });
    
    expect(rules.length).toBeGreaterThan(0);
  });

  it("should find carriers", async () => {
    const carr = await db.query.carriers.findMany();
    
    console.log("Carriers found:", carr.length);
    carr.forEach((c: any) => {
      console.log(`- ${c.name} (id=${c.id})`);
    });
    
    expect(carr.length).toBeGreaterThan(0);
  });

  it("should find shipping rules for carriers", async () => {
    const rules = await db.query.shippingRules.findMany({
      where: (rules: any, { ne }: any) => ne(rules.carrierId, 0),
    });
    
    console.log("Carrier rules found:", rules.length);
    rules.forEach((r: any) => {
      console.log(`- Carrier ${r.carrierId}: ${r.name} = R$ ${r.basePrice}`);
    });
    
    expect(rules.length).toBeGreaterThan(0);
  });
});
