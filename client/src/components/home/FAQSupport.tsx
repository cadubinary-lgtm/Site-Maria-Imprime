import { getCompanyWhatsAppMessage, getWhatsAppUrl, useCompanySettings, useWhatsAppButtonVisibility } from "@/hooks/useCompanySettings";
import { HOME_PRIMARY_ACTION_CLASS, HOME_SECONDARY_ACTION_CLASS } from "@/lib/homeActionStyles";

export function FAQSupport() {
  const { company } = useCompanySettings();
  const showWhatsApp = useWhatsAppButtonVisibility(company);
  const whatsappHref = getWhatsAppUrl(company.whatsappNumber, getCompanyWhatsAppMessage(company));
  const benefits = [
    { 
      icon: "/manus-storage/icone-1_652dcf5a.webp",
      label: "Atendimento humano" 
    },
    { 
      icon: "/manus-storage/icone-2_d9a3d5d8.webp",
      label: "Orçamento rápido" 
    },
    { 
      icon: "/manus-storage/icone-3_1_badf8b59.webp",
      label: "Arquivo conferido" 
    },
    { 
      icon: "/manus-storage/icone-4_2_6cf991b0.webp",
      label: "Aprovação antes da impressão" 
    },
  ];

  return (
    <section className="relative px-4 py-14 sm:py-16 lg:px-8 lg:py-20" aria-labelledby="faq-support-title">
      {/* Fundo com gradiente rosa suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-pink-50 -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-12">
          {/* ── COL 1: Mascote Maria ── */}
          <div className="flex justify-center lg:justify-start">
            <img
              src="/manus-storage/ChatGPT-Image-24-de-jun.-de-2026_-17_34_14_f75c66ec.webp"
              alt="Maria - Mascote"
              className="h-auto w-48 max-w-full object-contain drop-shadow-lg sm:w-56 lg:w-full lg:max-w-xs"
            />
          </div>

          {/* ── COL 2: Texto Principal ── */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <h2 id="faq-support-title" className="mb-4 text-2xl font-black leading-tight text-gray-900 lg:text-3xl">
              Não encontrou o que procura?
            </h2>
            <p className="text-gray-700 text-sm lg:text-base leading-relaxed mb-6 font-light">
              Fale com a Maria e receba uma recomendação personalizada para o que você precisa.
            </p>

            {/* CTA Button */}
            {showWhatsApp && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${HOME_PRIMARY_ACTION_CLASS} w-fit`}
                aria-label="Falar com a Maria pelo WhatsApp em nova aba"
              >
                <img src="/manus-storage/whastapp-branco_ab9ddb70.webp" alt="" aria-hidden="true" className="w-5 h-5" />
                <span>Falar com a Maria</span>
              </a>
            )}
            {!showWhatsApp && company.supportEmail && (
              <a href={`mailto:${company.supportEmail}`} className={`${HOME_SECONDARY_ACTION_CLASS} w-fit`}>
                Enviar e-mail para o atendimento
              </a>
            )}
          </div>

          {/* ── COL 3-4: Benefícios em coluna ── */}
          <ul className="space-y-4" aria-label="Diferenciais do atendimento">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="group flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <img
                    src={benefit.icon}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-gray-700 font-semibold text-sm lg:text-base group-hover:text-pink-600 transition-colors">
                  {benefit.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default FAQSupport;
