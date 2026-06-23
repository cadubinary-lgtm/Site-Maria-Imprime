import { Card, CardContent } from "@/components/ui/card";

const DIFFERENTIALS = [
  {
    icon: "⭐",
    title: "Produção própria",
    description: "com controle de qualidade",
  },
  {
    icon: "🚚",
    title: "Entrega para todo o Brasil",
    description: "com diversas opções de frete",
  },
  {
    icon: "📋",
    title: "Arquivo conferido",
    description: "antes da produção",
  },
  {
    icon: "✅",
    title: "Aprovação antes da impressão",
    description: "você aprova, nós imprimimos",
  },
];

export function DifferentialsSection() {
  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-4 text-center text-gray-900">Por que escolher a Maria Imprime?</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {DIFFERENTIALS.map((diff, idx) => (
            <Card key={idx} className="border-0 shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 text-center">
                <div className="text-5xl mb-4">{diff.icon}</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{diff.title}</h3>
                <p className="text-sm text-gray-600">{diff.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
