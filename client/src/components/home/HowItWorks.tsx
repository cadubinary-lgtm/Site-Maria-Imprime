export function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: "Escolha seu produto",
      description: "Encontre a opção ideal para seu projeto.",
    },
    {
      id: 2,
      title: "Envie seu arquivo",
      description: "Faça o upload da arte pronta para impressão.",
    },
    {
      id: 3,
      title: "Conferência técnica",
      description: "Nossa equipe verifica medidas, resolução e possíveis inconsistências.",
    },
    {
      id: 4,
      title: "Arquivo aprovado para produção",
      description: "Se estiver tudo certo, iniciamos a impressão.",
    },
    {
      id: 5,
      title: "Produção com carinho",
      description: "Seu material entra na fila de produção.",
    },
    {
      id: 6,
      title: "Pedido enviado",
      description: "Você acompanha a entrega pelo seu painel.",
    },
  ];

  return (
    <section className="bg-white py-16 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Como funciona</h2>
          <div className="w-16 h-1 bg-pink-600 mx-auto"></div>
        </div>

        <div className="overflow-x-auto pb-8">
          <div className="flex gap-8 min-w-max px-4 relative">
            {/* SVG for dashed arrows */}
            <svg className="absolute top-12 left-0 right-0 w-full h-12 pointer-events-none" style={{ height: "60px" }}>
              {steps.map((_, index) => {
                if (index < steps.length - 1) {
                  const startX = 100 + index * 200;
                  const endX = startX + 160;
                  return (
                    <g key={`arrow-${index}`}>
                      {/* Dashed line */}
                      <path
                        d={`M ${startX} 30 Q ${(startX + endX) / 2} 10 ${endX} 30`}
                        stroke="#E91E63"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="5,5"
                      />
                      {/* Arrow head */}
                      <polygon points={`${endX},30 ${endX - 6},26 ${endX - 6},34`} fill="#E91E63" />
                    </g>
                  );
                }
                return null;
              })}
            </svg>

            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center flex-shrink-0 w-44 pt-16">
                {/* Step number circle */}
                <div className="w-12 h-12 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold text-lg mb-4 relative z-10">
                  {step.id}
                </div>

                {/* Mascot placeholder (emoji) */}
                <div className="text-6xl mb-4">👧</div>

                {/* Title and description */}
                <h3 className="text-sm font-bold text-gray-900 text-center mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-600 text-center leading-tight">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
