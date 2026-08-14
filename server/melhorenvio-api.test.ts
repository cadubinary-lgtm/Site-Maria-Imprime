import { afterEach, describe, expect, it, vi } from "vitest";
import { getMeBaseUrl, getMeProfile } from "./melhorenvio-api";

describe("Melhor Envio — seleção de ambiente", () => {
  it("mantém as credenciais de Produção disponíveis no ambiente do servidor", () => {
    expect(process.env.MELHOR_ENVIO_CLIENT_ID).toBeTruthy();
    expect(process.env.MELHOR_ENVIO_CLIENT_SECRET).toBeTruthy();
  });

  it("usa o domínio oficial quando o ambiente de Produção está ativo", () => {
    expect(getMeBaseUrl(false)).toBe("https://melhorenvio.com.br");
  });

  it("mantém o domínio de sandbox disponível apenas para testes", () => {
    expect(getMeBaseUrl(true)).toBe("https://sandbox.melhorenvio.com.br");
  });

  it("envia o Token Bearer persistido ao consultar o perfil em Produção", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ firstname: "Maria", lastname: "Imprime", email: "contato@mariaimprime.com.br" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await getMeProfile("token-persistido-no-banco", false);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://melhorenvio.com.br/api/v2/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-persistido-no-banco" }),
      })
    );
  });
});

afterEach(() => vi.unstubAllGlobals());
