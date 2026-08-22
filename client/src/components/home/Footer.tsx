import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Flag,
  Facebook,
  Instagram,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Send,
  ShoppingBag,
  Tag,
  Youtube,
} from "lucide-react";
import { SiAmericanexpress, SiDinersclub, SiMastercard, SiVisa } from "react-icons/si";
import {
  getCompanyAddressLine,
  getCompanyLocationLine,
  getCompanyWhatsAppMessage,
  getValidSocialUrl,
  getWhatsAppUrl,
  useCompanySettings,
  useWhatsAppButtonVisibility,
} from "@/hooks/useCompanySettings";
import { trpc } from "@/lib/trpc";
import { FOOTER_PAYMENT_METHODS, mergeFooterContent, parseFooterPaymentMethodIds, parseFooterProductSegmentIds, type FooterPaymentMethodId } from "@/lib/siteContent";

const documentationPath = (documentId?: string) => documentId ? `/documentos/${documentId}` : "/documentos";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const institutionalLinks = [
  { label: "Início", href: "/" },
  { label: "Nossos produtos", href: "/catalogo" },
  { label: "Central de documentação", href: documentationPath() },
  { label: "Termos e condições de venda", href: documentationPath("termos-venda") },
  { label: "Termo de uso do site", href: documentationPath("uso-site") },
  { label: "Política de privacidade (LGPD)", href: documentationPath("privacidade-lgpd") },
  { label: "Política de cookies", href: documentationPath("cookies") },
  { label: "Minha conta", href: "/minha-conta" },
];

const supportLinks = [
  { label: "Dúvidas frequentes", href: documentationPath("faq") },
  { label: "Gabaritos", href: "/gabaritos" },
  { label: "Termo de aprovação de arte", href: documentationPath("aprovacao-arte") },
  { label: "Prazos de produção", href: documentationPath("producao-prazos") },
  { label: "Formas de pagamento", href: documentationPath("formas-pagamento") },
  { label: "Entrega e retirada", href: documentationPath("entrega-retirada") },
  { label: "Trocas e devoluções", href: documentationPath("trocas-reembolsos") },
];

const productLinks = [
  { label: "Cartões de visita", icon: CreditCard },
  { label: "Panfletos e folders", icon: FileText },
  { label: "Banners e faixas", icon: Flag },
  { label: "Adesivos e etiquetas", icon: Tag },
  { label: "Embalagens", icon: Package },
];

const paymentMethodVisuals: Record<FooterPaymentMethodId, React.ReactNode> = {
  visa: <SiVisa aria-hidden className="h-7 w-12 text-[#1434CB]" />,
  mastercard: <SiMastercard aria-hidden className="h-8 w-12 text-[#EB001B]" />,
  elo: <img src="/manus-storage/elo_78934248.png" alt="" aria-hidden className="h-8 w-full object-contain" />,
  hipercard: <img src="/manus-storage/hipercard_0e7a4bf3.png" alt="" aria-hidden className="h-8 w-full object-contain" />,
  "american-express": <SiAmericanexpress aria-hidden className="h-9 w-12 text-[#2E77BC]" />,
  cabal: <img src="/manus-storage/cabal_27d82c64.png" alt="" aria-hidden className="h-8 w-full object-contain" />,
  "diners-club": <SiDinersclub aria-hidden className="h-9 w-12 text-[#0079BE]" />,
};

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 inline-flex border-b-2 border-pink-500 pb-2 text-sm font-bold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-slate-500 transition-colors hover:bg-pink-100 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
    >
      {children}
    </a>
  );
}

function PaymentBadge({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} title={label} tabIndex={0} className="group relative flex h-16 w-full min-w-0 cursor-default items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-pink-300 hover:bg-pink-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2">
      {children}
      <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{label}</span>
    </div>
  );
}

function SecuritySealLink({ href, label, src }: { href: string; label: string; src: string }) {
  const tooltip = "Site 100% seguro e verificado";

  return (
    <a href={href} aria-label={`${label}. ${tooltip}`} target="_blank" rel="noopener noreferrer" className="group relative flex h-20 min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition duration-200 ease-out hover:scale-[1.03] hover:border-pink-300 hover:bg-pink-50/40 focus-visible:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100">
      <img src={src} alt="" aria-hidden className="h-16 w-full object-contain" />
      <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{tooltip}</span>
    </a>
  );
}

export function Footer() {
  const { company } = useCompanySettings();
  const { data: savedFooterContent } = trpc.siteContent.getPublicFooter.useQuery(undefined, { staleTime: 60_000 });
  const { data: allSegments = [] } = trpc.segments.list.useQuery(undefined, { staleTime: 60_000 });
  const footerContent = mergeFooterContent(savedFooterContent);
  const footerProductSegments = useMemo(() => {
    const segmentsById = new Map(allSegments.map((segment) => [segment.id, segment]));
    return parseFooterProductSegmentIds(savedFooterContent?.footerProductSegmentIds).flatMap((id) => {
      const segment = segmentsById.get(id);
      return segment ? [segment] : [];
    });
  }, [allSegments, savedFooterContent?.footerProductSegmentIds]);
  const footerPaymentMethodIds = useMemo(() => {
    const configuredIds = parseFooterPaymentMethodIds(savedFooterContent?.footerPaymentMethodIds);
    return configuredIds.length > 0 ? configuredIds : FOOTER_PAYMENT_METHODS.map((method) => method.id);
  }, [savedFooterContent?.footerPaymentMethodIds]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "error" | "success">("idle");
  const phoneHref = `tel:${company.commercialPhone.replace(/\D/g, "")}`;
  const showWhatsApp = useWhatsAppButtonVisibility(company);
  const whatsappHref = getWhatsAppUrl(company.whatsappNumber, getCompanyWhatsAppMessage(company));
  const instagramHref = getValidSocialUrl(company.instagramUrl, company.instagramActive);
  const facebookHref = getValidSocialUrl(company.facebookUrl, company.facebookActive);
  const youtubeHref = getValidSocialUrl(company.youtubeUrl, company.youtubeActive);
  const otherSocialHref = getValidSocialUrl(company.otherSocialUrl, company.otherSocialActive);
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!emailPattern.test(email)) {
      setNewsletterMessage("Digite um endereço de e-mail válido para continuar.");
      setNewsletterStatus("error");
      return;
    }

    setNewsletterMessage("Tudo certo! Abrimos seu e-mail para confirmar o cadastro.");
    setNewsletterStatus("success");
    setNewsletterEmail("");
    const subject = encodeURIComponent("Quero receber novidades da Maria Imprime");
    const body = encodeURIComponent(`Olá! Quero receber novidades e promoções da Maria Imprime.\n\nE-mail para cadastro: ${email}`);
    window.open(`mailto:${company.supportEmail}?subject=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
  };

  return (
    <footer id="site-footer" className="border-t-2 border-pink-200 bg-white text-slate-700">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 xl:grid-cols-[1.25fr_.72fr_.9fr_.9fr_1.14fr] xl:gap-8">
          <section className="max-w-sm" aria-label="Apresentação da Maria Imprime">
            <a href="/" aria-label="Página inicial da Maria Imprime" className="inline-flex">
              <img src={company.printLogoUrl || "/manus-storage/logo-maria-imprime_acc5585b.webp"} alt="Maria Imprime" className="h-16 w-auto object-contain sm:h-20" />
            </a>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              {footerContent.introduction}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {instagramHref && <SocialLink href={instagramHref} label="Instagram da Maria Imprime"><Instagram className="h-5 w-5" /></SocialLink>}
              {facebookHref && <SocialLink href={facebookHref} label="Facebook da Maria Imprime"><Facebook className="h-5 w-5" /></SocialLink>}
              {showWhatsApp && <SocialLink href={whatsappHref} label="WhatsApp da Maria Imprime"><MessageCircle className="h-5 w-5" /></SocialLink>}
              <a href={`mailto:${company.supportEmail}`} aria-label="Enviar e-mail para a Maria Imprime" className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-slate-500 transition-colors hover:bg-pink-100 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"><Mail className="h-5 w-5" /></a>
              {youtubeHref && <SocialLink href={youtubeHref} label="YouTube da Maria Imprime"><Youtube className="h-5 w-5" /></SocialLink>}
              {otherSocialHref && <SocialLink href={otherSocialHref} label="Outro canal oficial da Maria Imprime"><ArrowRight className="h-5 w-5" /></SocialLink>}
            </div>
          </section>

          <FooterColumn title="Institucional">
            <ul className="space-y-3 text-sm">
              {institutionalLinks.map((link) => <li key={link.label}><a href={link.href} className="transition-colors hover:text-pink-600 focus-visible:outline-none focus-visible:text-pink-600">{link.label}</a></li>)}
            </ul>
          </FooterColumn>

          <FooterColumn title="Ajuda e suporte">
            <ul className="space-y-3 text-sm">
              {supportLinks.map((link) => <li key={link.label}><a href={link.href} className="transition-colors hover:text-pink-600 focus-visible:outline-none focus-visible:text-pink-600">{link.label}</a></li>)}
              <li><a href="/contato" className="font-medium text-pink-600 transition-colors hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">Fale conosco</a></li>
            </ul>
          </FooterColumn>

          <FooterColumn title="Produtos">
            <ul className="space-y-3 text-sm">
              {footerProductSegments.length > 0
                ? footerProductSegments.map((segment) => <li key={segment.id}><a href={`/catalogo?segmentId=${segment.id}`} className="flex items-center gap-2.5 transition-colors hover:text-pink-600 focus-visible:outline-none focus-visible:text-pink-600"><ShoppingBag className="h-4 w-4 text-pink-500" />{segment.name}</a></li>)
                : productLinks.map(({ label, icon: Icon }) => <li key={label}><a href="/catalogo" className="flex items-center gap-2.5 transition-colors hover:text-pink-600 focus-visible:outline-none focus-visible:text-pink-600"><Icon className="h-4 w-4 text-pink-500" />{label}</a></li>)}
            </ul>
            <a href="/catalogo" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-pink-600 transition-colors hover:text-pink-700">Ver todos os produtos <ArrowRight className="h-4 w-4" /></a>
          </FooterColumn>

          <section className="rounded-2xl border border-pink-200 bg-pink-50/70 p-6 shadow-sm" aria-labelledby="newsletter-title">
            <h2 id="newsletter-title" className="text-xl font-bold text-pink-600">{footerContent.newsletterTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{footerContent.newsletterDescription}</p>
            <form className="mt-5 space-y-3" onSubmit={handleNewsletterSubmit} noValidate>
              <label className="sr-only" htmlFor="newsletter-email">Seu melhor e-mail</label>
              <input id="newsletter-email" type="email" required value={newsletterEmail} onChange={(event) => { setNewsletterEmail(event.target.value); setNewsletterStatus("idle"); setNewsletterMessage(""); }} aria-invalid={newsletterStatus === "error"} aria-describedby="newsletter-feedback" placeholder="Seu melhor e-mail" className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus-visible:ring-2 ${newsletterStatus === "error" ? "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-100" : "border-slate-200 focus-visible:border-pink-500 focus-visible:ring-pink-100"}`} />
              <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 text-sm font-bold text-white transition hover:bg-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2">Quero receber <Send className="h-4 w-4" /></button>
              <p id="newsletter-feedback" role={newsletterStatus === "error" ? "alert" : "status"} className={`flex min-h-5 items-center gap-1.5 text-xs ${newsletterStatus === "success" ? "text-emerald-700" : newsletterStatus === "error" ? "text-red-600" : "text-slate-500"}`} aria-live="polite">{newsletterStatus === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />}{newsletterMessage}</p>
            </form>
          </section>
        </div>

        <section className="mt-12 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-label="Pagamentos e segurança">
          <div className="p-6 sm:p-7">
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Formas de pagamento</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-7">
              {footerPaymentMethodIds.map((paymentMethodId) => {
                const paymentMethod = FOOTER_PAYMENT_METHODS.find((method) => method.id === paymentMethodId);
                return paymentMethod ? <PaymentBadge key={paymentMethodId} label={paymentMethod.label}>{paymentMethodVisuals[paymentMethodId]}</PaymentBadge> : null;
              })}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Pagamentos parcelados terão acréscimo de juros da operadora. Nota fiscal sujeita a emissão de acordo com prestador de serviço, conforme legislação pertinente.</p>
          </div>
          <div className="border-t border-slate-200 p-6 sm:p-7 lg:border-l lg:border-t-0">
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Segurança e proteção</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <SecuritySealLink href="https://transparencyreport.google.com/safe-browsing/search?url=mariaimprime.com.br" label="Google Safe Browsing" src="/manus-storage/google-safe-browsing-large_347d2bfd.png" />
              <SecuritySealLink href="https://www.sslshopper.com/ssl-checker.html#hostname=mariaimprime.com.br" label="SSL Certificado" src="/manus-storage/ssl-certificado_6ff35a41.png" />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 border-t border-pink-200 pt-8 text-sm md:grid-cols-3" aria-label="Dados de atendimento e empresa">
          <div>
            <h2 className="font-bold text-slate-900">Atendimento</h2>
            <div className="mt-4 space-y-2.5 text-slate-600">
              <a href={phoneHref} className="flex items-center gap-2.5 hover:text-pink-600"><Phone className="h-4 w-4 text-pink-500" />{company.commercialPhone}</a>
              <a href={`mailto:${company.supportEmail}`} className="flex items-center gap-2.5 hover:text-pink-600"><Mail className="h-4 w-4 text-pink-500" />{company.supportEmail}</a>
              <p className="flex items-start gap-2.5"><ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" /><span className="whitespace-pre-line">{footerContent.businessHours}</span></p>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <h2 className="font-bold text-slate-900">{company.legalName}</h2>
            <div className="mt-4 space-y-2.5 text-slate-600">
              <p className="flex items-center gap-2.5"><FileText className="h-4 w-4 text-pink-500" />CNPJ: {company.cnpj}</p>
              <p className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" /><span>{getCompanyAddressLine(company)}<br />{getCompanyLocationLine(company)}<br />CEP: {company.zipCode}</span></p>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <h2 className="font-bold text-slate-900">Todos os direitos reservados</h2>
            <p className="mt-4 leading-6 text-slate-600">© {currentYear} Maria Imprime / Gráfica Ponto Digital. Todos os direitos reservados.</p>
            <p className="mt-2 flex items-center gap-2 text-slate-600"><LockKeyhole className="h-4 w-4 text-pink-500" />Site protegido (SSL)</p>
          </div>
        </section>
      </div>
    </footer>
  );
}

export default Footer;
