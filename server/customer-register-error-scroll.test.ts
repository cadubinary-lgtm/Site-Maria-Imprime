import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("aviso de erro no cadastro de cliente", () => {
  it("rola suavemente até o alerta ao receber uma mensagem de validação", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/ecommerce/CustomerRegister.tsx"), "utf8");

    expect(source).toContain("const errorAlertRef = useRef<HTMLDivElement>(null)");
    expect(source).toContain('errorAlertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })');
    expect(source).toContain("<div ref={errorAlertRef}>");
  });
});
