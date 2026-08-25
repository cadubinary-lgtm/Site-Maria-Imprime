import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const consentSource = readFileSync(resolve(process.cwd(), "client/src/lib/cookieConsent.ts"), "utf8");
const bannerSource = readFileSync(resolve(process.cwd(), "client/src/components/CookieConsentBanner.tsx"), "utf8");
const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("consentimento de cookies", () => {
  it("persiste escolhas por categoria sem tornar categorias opcionais ativas por padrão", () => {
    expect(consentSource).toContain('COOKIE_CONSENT_STORAGE_KEY = "maria-imprime-cookie-consent-v1"');
    expect(consentSource).toContain("analytics: false");
    expect(consentSource).toContain("functional: false");
    expect(consentSource).toContain("marketing: false");
    expect(consentSource).toContain("window.localStorage.setItem");
    expect(consentSource).toContain("maria-imprime-cookie-consent");
  });

  it("oferece aceitar, recusar e configurar em todas as páginas públicas", () => {
    expect(bannerSource).toContain("Aceitar todos");
    expect(bannerSource).toContain("Recusar opcionais");
    expect(bannerSource).toContain("Configurar");
    expect(bannerSource).toContain('href="/documentos/cookies"');
    expect(appSource).toContain("<CookieConsentBanner />");
  });

  it("permite revisar as preferências depois da primeira decisão", () => {
    expect(bannerSource).toContain("Preferências de cookies");
    expect(bannerSource).toContain("Salvar preferências");
    expect(bannerSource).toContain('role="switch"');
  });
});
