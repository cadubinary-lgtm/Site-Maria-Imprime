import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  FileText,
  Flag,
  Facebook,
  Instagram,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Send,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Youtube,
} from "lucide-react";
import {
  getCompanyAddressLine,
  getCompanyLocationLine,
  getCompanyWhatsAppMessage,
  getValidSocialUrl,
  getWhatsAppUrl,
  useCompanySettings,
  useWhatsAppButtonVisibility,
} from "@/hooks/useCompanySettings";

const documentationUrl = "/produto/1200001#terms";

const institutionalLinks = [
  { label: "Início", href: "/" },
  { label: "Nossos produtos", href: "/catalogo" },
  { label: "Central de documentação", href: documentationUrl },
  { label: "Minha conta", href: "/minha-conta" },
];

const supportLinks = [
  { label: "Dúvidas frequentes", href: documentationUrl },
  { label: "Prazos de produção", href: documentationUrl },
  { label: "Formas de pagamento", href: documentationUrl },
  { label: "Entrega e retirada", href: documentationUrl },
  { label: "Trocas e devoluções", href: documentationUrl },
];

const productLinks = [
  { label: "Cartões de visita", icon: CreditCard },
  { label: "Panfletos e folders", icon: FileText },
  { label: "Banners e faixas", icon: Flag },
  { label: "Adesivos e etiquetas", icon: Tag },
  { label: "Embalagens", icon: Package },
];

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

function PaymentBadge({ children }: { children: React.ReactNode }) {
  return <div className="flex h-14 min-w-24 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm">{children}</div>;
}

export function Footer() {
  const { company } = useCompanySettings();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
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
    if (!email) {
      setNewsletterMessage("Informe um e-mail válido para continuar.");
      return;
    }

    setNewsletterMessage("Abriremos seu aplicativo de e-mail para confirmar o cadastro.");
    const subject = encodeURIComponent("Quero receber novidades da Maria Imprime");
    const body = encodeURIComponent(`Olá! Quero receber novidades e promoções da Maria Imprime.\n\nE-mail para cadastro: ${email}`);
    window.location.href = `mailto:${company.supportEmail}?subject=${subject}&body=${body}`;
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
              A Maria Imprime transforma suas ideias em comunicação visual com atenção aos detalhes, praticidade e qualidade em cada pedido.
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
              <li><a href={showWhatsApp ? whatsappHref : `mailto:${company.supportEmail}`} className="font-medium text-pink-600 transition-colors hover:text-pink-700">Fale conosco</a></li>
            </ul>
          </FooterColumn>

          <FooterColumn title="Produtos">
            <ul className="space-y-3 text-sm">
              {productLinks.map(({ label, icon: Icon }) => <li key={label}><a href="/catalogo" className="flex items-center gap-2.5 transition-colors hover:text-pink-600 focus-visible:outline-none focus-visible:text-pink-600"><Icon className="h-4 w-4 text-pink-500" />{label}</a></li>)}
            </ul>
            <a href="/catalogo" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-pink-600 transition-colors hover:text-pink-700">Ver todos os produtos <ArrowRight className="h-4 w-4" /></a>
          </FooterColumn>

          <section className="rounded-2xl border border-pink-200 bg-pink-50/70 p-6 shadow-sm" aria-labelledby="newsletter-title">
            <h2 id="newsletter-title" className="text-xl font-bold text-pink-600">Fique por dentro!</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Receba novidades, promoções e dicas exclusivas da Maria Imprime.</p>
            <form className="mt-5 space-y-3" onSubmit={handleNewsletterSubmit}>
              <label className="sr-only" htmlFor="newsletter-email">Seu melhor e-mail</label>
              <input id="newsletter-email" type="email" required value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="Seu melhor e-mail" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
              <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 text-sm font-bold text-white transition hover:bg-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2">Quero receber <Send className="h-4 w-4" /></button>
              <p className="min-h-5 text-xs text-slate-500" aria-live="polite">{newsletterMessage}</p>
            </form>
          </section>
        </div>

        <section className="mt-12 grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 lg:grid-cols-[1.08fr_1fr_1.12fr]" aria-label="Pagamentos e segurança">
          <div className="p-6">
            <h2 className="text-sm font-bold text-slate-900">Formas de pagamento</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <PaymentBadge><Landmark className="mr-1.5 h-5 w-5 text-cyan-500" />PIX</PaymentBadge>
              <PaymentBadge><span className="text-blue-700">VISA</span></PaymentBadge>
              <PaymentBadge><span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-yellow-300">MC</span></PaymentBadge>
            </div>
          </div>
          <div className="border-t border-slate-200 p-6 lg:border-l lg:border-t-0">
            <h2 className="text-sm font-bold text-slate-900">Segurança e proteção</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex h-14 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm"><ShieldCheck className="h-6 w-6 text-emerald-600" />Google Safe Browsing</div>
              <div className="flex h-14 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm"><LockKeyhole className="h-6 w-6 text-emerald-600" />SSL</div>
            </div>
          </div>
          <div className="flex gap-4 border-t border-slate-200 p-6 lg:border-l lg:border-t-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600"><BadgeCheck className="h-7 w-7" /></div>
            <div><h2 className="font-bold text-slate-900">Ambiente protegido</h2><p className="mt-1 text-sm leading-6 text-slate-600">Navegação segura e proteção dos seus dados.</p></div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 border-t border-pink-200 pt-8 text-sm md:grid-cols-3" aria-label="Dados de atendimento e empresa">
          <div>
            <h2 className="font-bold text-slate-900">Atendimento</h2>
            <div className="mt-4 space-y-2.5 text-slate-600">
              <a href={phoneHref} className="flex items-center gap-2.5 hover:text-pink-600"><Phone className="h-4 w-4 text-pink-500" />{company.commercialPhone}</a>
              <a href={`mailto:${company.supportEmail}`} className="flex items-center gap-2.5 hover:text-pink-600"><Mail className="h-4 w-4 text-pink-500" />{company.supportEmail}</a>
              <p className="flex items-start gap-2.5"><ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" /><span>Seg–Sex: 09:00 – 12:00 e 13:30 – 17:00<br />Sábado e domingo: fechado</span></p>
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
