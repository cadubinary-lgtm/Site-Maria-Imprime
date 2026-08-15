import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("acesso seguro de parceiros", () => {
  it("mantém Revendedor e Agência como perfis e envia definição de senha por link", () => {
    const schema = readFileSync("drizzle/schema.ts", "utf8");
    const router = readFileSync("server/routers/customerAuth.ts", "utf8");
    expect(schema).toContain('accountType: mysqlEnum("accountType", ["customer", "reseller", "agency"])');
    expect(router).toContain("adminCreatePartnerAccount");
    expect(router).toContain("adminResendPartnerInvite");
    expect(router).toContain("sendPasswordResetEmail(email");
    expect(router).toContain('password: z.string().min(8, "A senha temporária deve ter ao menos 8 caracteres")');
    expect(router).toContain("bcrypt.hash(input.password, SALT_ROUNDS)");
  });
});
