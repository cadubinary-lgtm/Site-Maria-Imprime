export const COOKIE_CONSENT_STORAGE_KEY = "maria-imprime-cookie-consent-v1";

export type CookieConsentPreferences = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

export type CookieConsentRecord = {
  version: 1;
  savedAt: string;
  preferences: CookieConsentPreferences;
};

export const DEFAULT_COOKIE_PREFERENCES: CookieConsentPreferences = {
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
};

export function getCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (parsed.version !== 1 || !parsed.preferences) return null;

    return {
      version: 1,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date(0).toISOString(),
      preferences: {
        necessary: true,
        analytics: parsed.preferences.analytics === true,
        functional: parsed.preferences.functional === true,
        marketing: parsed.preferences.marketing === true,
      },
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent(preferences: CookieConsentPreferences) {
  if (typeof window === "undefined") return;

  const record: CookieConsentRecord = {
    version: 1,
    savedAt: new Date().toISOString(),
    preferences: { ...preferences, necessary: true },
  };

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent("maria-imprime-cookie-consent", { detail: record }));
}

export function hasCookieConsent(category: keyof CookieConsentPreferences) {
  if (category === "necessary") return true;
  return getCookieConsent()?.preferences[category] === true;
}
