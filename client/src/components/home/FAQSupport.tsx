import { getCompanyWhatsAppMessage, getWhatsAppUrl, useCompanySettings, useWhatsAppButtonVisibility } from "@/hooks/useCompanySettings";

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
    <section className="relative py-20 px-4 lg:px-8 overflow-hidden" style={{minHeight: '386px', paddingTop: '50px'}}>
      {/* Fundo com gradiente rosa suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-pink-50 -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center" style={{minHeight: '282px', marginTop: '-57px', paddingBottom: '1px', paddingLeft: '72px', paddingTop: '4px', marginBottom: '-38px', marginLeft: '-25px', marginRight: '12px'}}>
          {/* ── COL 1: Mascote Maria ── */}
          <div className="flex justify-center lg:justify-start">
            <img
              src="/manus-storage/ChatGPT-Image-24-de-jun.-de-2026_-17_34_14_f75c66ec.webp"
              alt="Maria - Mascote"
              className="w-full max-w-xs h-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* ── COL 2: Texto Principal ── */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-4 leading-tight">
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
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 w-fit"
              >
                <img src="/manus-storage/whastapp-branco_ab9ddb70.webp" alt="WhatsApp" className="w-5 h-5" />
                <span>Falar com a Maria</span>
              </a>
            )}
          </div>

          {/* ── COL 3-4: Benefícios em coluna ── */}
          <div className="lg:col-span-2 space-y-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <img
                    src={benefit.icon}
                    alt={benefit.label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-gray-700 font-semibold text-sm lg:text-base group-hover:text-pink-600 transition-colors">
                  {benefit.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FAQSupport;
