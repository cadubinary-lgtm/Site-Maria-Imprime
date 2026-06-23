const STEPS = [
  {
    number: 1,
    title: "Escolha seu produto",
    description: "Encontre a solução ideal para seu projeto",
  },
  {
    number: 2,
    title: "Envie seu arquivo",
    description: "Faça o upload de arte pronta para impressão",
  },
  {
    number: 3,
    title: "Conferência técnica",
    description: "Nossa equipe valida medidas, resolução e possíveis inconsistências",
  },
  {
    number: 4,
    title: "Arquivo aprovado",
    description: "Receba tudo certo, incômodo e imprimimos",
  },
  {
    number: 5,
    title: "Produção com cariho",
    description: "Seu material entra na fila de produção",
  },
  {
    number: 6,
    title: "Pedido enviado",
    description: "Você acompanha a entrega pelo seu painel",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-2 text-center text-gray-900">Como funciona</h2>
        <div className="flex justify-center mb-12">
          <div className="w-12 h-1 bg-pink-600 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.number} className="relative">
              {/* Mascote placeholder - minimalista */}
              <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-8 mb-4 flex items-center justify-center min-h-40 border border-pink-100 shadow-sm">
                <div className="text-center">
                  <div className="text-4xl mb-2">👩</div>
                  <p className="text-gray-600 text-xs font-light">Mascote {step.number}</p>
                </div>
              </div>

              {/* Step number circle */}
              <div className="absolute -top-3 -left-3 bg-pink-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-sm">
                {step.number}
              </div>

              {/* Content */}
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">{step.title}</h3>
              <p className="text-gray-600 text-xs leading-relaxed font-light">{step.description}</p>

              {/* Arrow connector (hidden on last item) */}
              {step.number < 6 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 transform translate-x-full">
                  <svg className="w-6 h-6 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
