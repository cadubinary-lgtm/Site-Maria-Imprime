export function WhyChooseUs() {
  const reasons = [
    {
      id: 1,
      title: "Produção própria",
      description: "com controle de qualidade",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#E6005C" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6M12 8v4M8 8l2.828-2.828M16 8l-2.828-2.828M12 4v2" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Entrega para todo o Brasil",
      description: "com diversas opções de frete",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#E6005C" strokeWidth="2">
          <rect x="2" y="7" width="20" height="10" rx="2" />
          <path d="M16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2M6 17v2c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-2" />
          <circle cx="7" cy="17" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </svg>
      ),
    },
    {
      id: 3,
      title: "Arquivo conferido",
      description: "antes da produção",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#E6005C" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 15l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 4,
      title: "Aprovação antes da impressão",
      description: "você aprova, nós imprimimos",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#E6005C" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-white py-8 lg:py-12 px-4 lg:px-8" style={{height: 'auto', minHeight: 'auto', paddingBottom: '24px', paddingTop: '17px', marginTop: '-42px'}}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl lg:text-2xl font-bold text-center text-gray-900 mb-6 lg:mb-12">
          Por que escolher a Maria Imprime?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {reasons.map((reason) => (
            <div key={reason.id} className="flex gap-3 lg:gap-4">
              <div className="flex-shrink-0 mt-1">{reason.icon}</div>
              <div>
                <h3 className="text-xs lg:text-sm font-bold text-gray-900">
                  {reason.title}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5 lg:mt-1">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
