import { describe, it, expect } from "vitest";

describe("Resend API Key", () => {
  it("deve ter RESEND_API_KEY definida no ambiente", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect(key!.length).toBeGreaterThan(0);
  });

  it("deve ter RESEND_FROM_EMAIL definida no ambiente", () => {
    const from = process.env.RESEND_FROM_EMAIL;
    // Pode ser onboarding@resend.dev ou outro email configurado
    expect(from).toBeDefined();
  });
});
