export function FAQSupport() {
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
    <section className="relative py-20 px-4 lg:px-8 overflow-hidden">
      {/* Fundo com gradiente rosa suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-pink-50 -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
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
            <a
              href="https://wa.me/22999459596"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 w-fit"
            >
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.255.949c-1.238.503-2.39 1.242-3.286 2.128-1.797 1.809-2.813 4.26-2.813 6.837 0 1.52.37 3.011 1.07 4.345l-1.137 4.159c-.214.782.156 1.627.93 1.813l.04.01c.217.043.427.06.639.06.758 0 1.467-.263 2.018-.743l3.285-2.776a9.9 9.9 0 004.59 1.15h.005c5.443 0 9.87-4.426 9.87-9.87 0-2.633-.997-5.109-2.812-6.982-1.816-1.873-4.217-2.906-6.758-2.906z" />
              </svg>
              <span>Falar com a Maria</span>
            </a>
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
