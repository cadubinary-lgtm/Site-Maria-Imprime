export function WhyChooseUs() {
  const reasons = [
    {
      id: 1,
      title: "Produção própria",
      description: "com controle de qualidade",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#E6005C" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6M12 8v4M8 8l2.828-2.828M16 8l-2.828-2.828M12 4v2" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Enviamos para diversas cidades do Brasil",
      description: "Consulte o envio para a sua região",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#E6005C" strokeWidth="2" aria-hidden="true">
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
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#E6005C" strokeWidth="2" aria-hidden="true">
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
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#E6005C" strokeWidth="2" aria-hidden="true">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-white px-4 py-12 lg:px-8 lg:py-16" aria-labelledby="why-choose-us-title">
      <div className="mx-auto max-w-7xl">
        <h2 id="why-choose-us-title" className="mb-6 text-center text-xl font-bold text-gray-900 lg:mb-10 lg:text-2xl">
          Por que escolher a Maria Imprime?
        </h2>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6" aria-label="Diferenciais da Maria Imprime">
          {reasons.map((reason) => (
            <li key={reason.id} className="flex items-start gap-3 rounded-2xl border border-pink-100 bg-pink-50/40 p-4 sm:p-5">
              <div className="mt-0.5 shrink-0 rounded-xl bg-white p-2 text-pink-600 shadow-sm">{reason.icon}</div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{reason.title}</h3>
                <p className="mt-1 text-xs text-gray-600 lg:text-sm">{reason.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
