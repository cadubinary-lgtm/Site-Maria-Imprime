import { useEffect, useState } from "react";
import { Cookie, Settings2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_COOKIE_PREFERENCES,
  getCookieConsent,
  saveCookieConsent,
  type CookieConsentPreferences,
} from "@/lib/cookieConsent";

const COOKIE_CATEGORIES: Array<{
  key: keyof Omit<CookieConsentPreferences, "necessary">;
  title: string;
  description: string;
}> = [
  {
    key: "analytics",
    title: "Desempenho e análise",
    description: "Ajuda a entender quais páginas e recursos são mais úteis para melhorar o site.",
  },
  {
    key: "functional",
    title: "Funcionalidade",
    description: "Permite lembrar preferências adicionais que tornam sua navegação mais prática.",
  },
  {
    key: "marketing",
    title: "Marketing",
    description: "Permite comunicações e campanhas mais relevantes quando esses recursos estiverem ativos.",
  },
];

export function CookieConsentBanner() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasDecided, setHasDecided] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(DEFAULT_COOKIE_PREFERENCES);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent) {
      setPreferences(consent.preferences);
      setHasDecided(true);
    }
    setIsHydrated(true);
  }, []);

  const persistPreferences = (nextPreferences: CookieConsentPreferences) => {
    const normalized: CookieConsentPreferences = { ...nextPreferences, necessary: true };
    saveCookieConsent(normalized);
    setPreferences(normalized);
    setHasDecided(true);
    setShowSettings(false);
  };

  const acceptAll = () => persistPreferences({ necessary: true, analytics: true, functional: true, marketing: true });
  const rejectOptional = () => persistPreferences(DEFAULT_COOKIE_PREFERENCES);

  if (!isHydrated) return null;

  return (
    <>
      {!hasDecided && (
        <section
          className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-3xl rounded-2xl border border-pink-200 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:bottom-5"
          aria-label="Consentimento de cookies"
          role="dialog"
          aria-modal="false"
        >
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700"><Cookie className="h-5 w-5" aria-hidden="true" /></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900">Como você prefere seus cookies?</h2>
                <a href="/documentos/cookies" className="text-sm font-semibold text-pink-700 underline-offset-4 hover:underline">Política de cookies</a>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">Usamos cookies essenciais para manter carrinho, login e segurança. Com sua autorização, também poderemos usar categorias opcionais para melhorar a experiência.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Button type="button" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50" onClick={rejectOptional}>Recusar opcionais</Button>
            <Button type="button" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={() => setShowSettings(true)}><Settings2 className="mr-2 h-4 w-4" aria-hidden="true" />Configurar</Button>
            <Button type="button" className="bg-pink-600 text-white hover:bg-pink-700" onClick={acceptAll}>Aceitar todos</Button>
          </div>
        </section>
      )}

      {hasDecided && (
        <button
          type="button"
          className="fixed bottom-4 left-4 z-40 rounded-full border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-pink-700 shadow-lg transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          onClick={() => setShowSettings(true)}
          aria-label="Revisar preferências de cookies"
        >
          Preferências de cookies
        </button>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-pink-100 p-0 sm:max-w-2xl" showCloseButton={false}>
          <DialogHeader className="border-b border-pink-100 bg-pink-50/60 p-6 text-left">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div><div><DialogTitle>Preferências de cookies</DialogTitle><DialogDescription className="mt-1.5">Você pode mudar sua escolha a qualquer momento. Cookies essenciais permanecem ativos para o funcionamento do site.</DialogDescription></div></div>
              <button type="button" className="rounded-md p-1 text-slate-500 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300" onClick={() => setShowSettings(false)} aria-label="Fechar preferências"><X className="h-5 w-5" /></button>
            </div>
          </DialogHeader>
          <div className="space-y-3 p-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">Essenciais</p><p className="mt-1 text-sm leading-5 text-slate-600">Necessários para segurança, carrinho, autenticação e funcionamento básico do site.</p></div><span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Sempre ativos</span></div></div>
            {COOKIE_CATEGORIES.map((category) => {
              const enabled = preferences[category.key];
              return <div key={category.key} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{category.title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{category.description}</p></div><button type="button" role="switch" aria-checked={enabled} onClick={() => setPreferences((current) => ({ ...current, [category.key]: !current[category.key] }))} className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${enabled ? "bg-pink-600" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-5" : "left-0.5"}`} /></button></div></div>;
            })}
          </div>
          <DialogFooter className="border-t border-slate-100 bg-white p-6 sm:justify-between"><Button type="button" variant="outline" onClick={rejectOptional}>Recusar opcionais</Button><Button type="button" className="bg-pink-600 text-white hover:bg-pink-700" onClick={() => persistPreferences(preferences)}>Salvar preferências</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
