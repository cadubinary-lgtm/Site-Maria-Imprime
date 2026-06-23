export function WhyChooseUs() {
  const reasons = [
    {
      id: 1,
      icon: "🎖️",
      title: "Produção própria",
      description: "com controle de qualidade",
    },
    {
      id: 2,
      icon: "🚚",
      title: "Entrega para todo o Brasil",
      description: "com diversas opções de frete",
    },
    {
      id: 3,
      icon: "📋",
      title: "Arquivo conferido",
      description: "antes da produção",
    },
    {
      id: 4,
      icon: "✅",
      title: "Aprovação antes da impressão",
      description: "você aprova, nós imprimimos",
    },
  ];

  return (
    <section className="bg-white py-16 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Por que escolher a Maria Imprime?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason) => (
            <div
              key={reason.id}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-5xl mb-4">{reason.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {reason.title}
              </h3>
              <p className="text-sm text-gray-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
