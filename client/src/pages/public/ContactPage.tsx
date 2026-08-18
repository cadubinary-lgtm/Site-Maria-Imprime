import { Clock3, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import Footer from "@/components/home/Footer";
import { HOME_PRIMARY_ACTION_CLASS, HOME_SECONDARY_ACTION_CLASS } from "@/lib/homeActionStyles";
import {
  getCompanyAddressLine,
  getCompanyLocationLine,
  getCompanyWhatsAppMessage,
  getWhatsAppUrl,
  useCompanySettings,
  useWhatsAppButtonVisibility,
} from "@/hooks/useCompanySettings";

function formatWhatsappHours(start: string | null | undefined, end: string | null | undefined) {
  return `${start || "09:00"} às ${end || "17:00"}`;
}

export default function ContactPage() {
  const { company, isLoading } = useCompanySettings();
  const showWhatsApp = useWhatsAppButtonVisibility(company);
  const whatsappHref = getWhatsAppUrl(company.whatsappNumber, getCompanyWhatsAppMessage(company));
  const phoneDigits = company.commercialPhone.replace(/\D/g, "");
  const addressLine = getCompanyAddressLine(company);
  const locationLine = getCompanyLocationLine(company);
  const mapQuery = encodeURIComponent(`${addressLine}, ${locationLine}, Brasil`);
  const hours = formatWhatsappHours(company.whatsappStartTime, company.whatsappEndTime);

  const channels = [
    {
      id: "telefone",
      title: "Telefone comercial",
      description: company.commercialPhone || "Telefone em atualização",
      href: phoneDigits ? `tel:+${phoneDigits}` : undefined,
      icon: Phone,
      action: "Ligar agora",
    },
    {
      id: "email",
      title: "E-mail de atendimento",
      description: company.supportEmail || "E-mail em atualização",
      href: company.supportEmail ? `mailto:${company.supportEmail}` : undefined,
      icon: Mail,
      action: "Enviar e-mail",
    },
  ];

  return (
    <main className="bg-white" aria-labelledby="contact-page-title">
      <section className="relative overflow-hidden border-b border-pink-100 bg-gradient-to-br from-pink-50 via-white to-pink-100 px-4 py-14 sm:py-20 lg:px-8">
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-pink-200/40 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">Atendimento Maria Imprime</p>
          <h1 id="contact-page-title" className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">Vamos tirar seu projeto do papel.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Fale com a nossa equipe para receber orientação sobre materiais, acabamentos, arquivos e prazos de produção.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {showWhatsApp ? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={HOME_PRIMARY_ACTION_CLASS} aria-label="Falar com a Maria pelo WhatsApp em nova aba"><MessageCircle className="h-5 w-5" aria-hidden="true" />Falar pelo WhatsApp</a> : company.supportEmail ? <a href={`mailto:${company.supportEmail}`} className={HOME_PRIMARY_ACTION_CLASS}><Mail className="h-5 w-5" aria-hidden="true" />Enviar e-mail</a> : null}
            <a href="/catalogo" className={HOME_SECONDARY_ACTION_CLASS}><Send className="h-5 w-5" aria-hidden="true" />Explorar produtos</a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:px-8" aria-label="Canais de atendimento">
        {showWhatsApp && <article className="rounded-2xl border border-pink-200 bg-pink-50 p-6 shadow-sm"><MessageCircle className="h-7 w-7 text-pink-600" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold text-slate-900">WhatsApp</h2><p className="mt-2 text-sm leading-6 text-slate-600">Atendimento rápido para dúvidas e orçamento.</p><a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex font-semibold text-pink-700 transition-colors hover:text-pink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">Abrir conversa<span className="sr-only"> no WhatsApp, em nova aba</span></a></article>}
        {channels.map(({ id, title, description, href, icon: Icon, action }) => <article key={id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Icon className="h-7 w-7 text-pink-600" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2><p className="mt-2 break-words text-sm leading-6 text-slate-600">{description}</p>{href && <a href={href} className="mt-5 inline-flex font-semibold text-pink-700 transition-colors hover:text-pink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">{action}</a>}</article>)}
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-14 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8"><div className="flex items-start gap-3"><MapPin className="mt-0.5 h-6 w-6 shrink-0 text-pink-600" aria-hidden="true" /><div><h2 className="text-xl font-bold text-slate-900">Visite a nossa gráfica</h2><address className="mt-3 not-italic text-sm leading-6 text-slate-600"><strong className="font-semibold text-slate-800">{company.tradeName}</strong><br />{addressLine}<br />{locationLine}<br />CEP {company.zipCode}</address><a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex font-semibold text-pink-700 transition-colors hover:text-pink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">Ver rota no mapa<span className="sr-only">, em nova aba</span></a></div></div></article>
        <article className="rounded-2xl border border-pink-200 bg-pink-50 p-6 sm:p-8"><div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-6 w-6 shrink-0 text-pink-600" aria-hidden="true" /><div><h2 className="text-xl font-bold text-slate-900">Horários de atendimento</h2><p className="mt-3 text-sm leading-6 text-slate-600">{company.useWhatsappBusinessHours ? "WhatsApp disponível nos dias e horários configurados." : "Consulte a equipe para confirmar o melhor horário de atendimento."}</p><p className="mt-3 text-sm font-semibold text-slate-800">{hours}</p><p className="mt-1 text-xs text-slate-500">Horário de Brasília.</p></div></div></article>
      </section>

      {isLoading && <p className="sr-only" role="status">Atualizando dados de atendimento.</p>}
      <Footer />
    </main>
  );
}
