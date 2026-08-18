import { Card, CardContent } from "@/components/ui/card";
import { FileCheck2, Headphones, ShieldCheck, Truck } from "lucide-react";

const SERVICE_COMMITMENTS = [
  {
    title: "Atendimento próximo",
    description: "Conte com orientação para escolher o produto e preparar o seu pedido.",
    Icon: Headphones,
  },
  {
    title: "Arquivo em conferência",
    description: "Sua arte passa pela conferência antes de seguir para o fluxo de produção.",
    Icon: FileCheck2,
  },
  {
    title: "Produção organizada",
    description: "Acompanhe o andamento do seu pedido com mais clareza em cada etapa.",
    Icon: ShieldCheck,
  },
  {
    title: "Entrega ou retirada",
    description: "Escolha a modalidade disponível que seja mais conveniente para você.",
    Icon: Truck,
  },
];

export function Testimonials() {
  return (
    <section className="bg-white px-4 py-16 sm:py-20" aria-labelledby="service-commitments-title">
      <div className="mx-auto max-w-7xl">
        <h2 id="service-commitments-title" className="mb-3 text-center text-3xl font-bold text-gray-900">Como cuidamos do seu pedido</h2>
        <p className="text-center text-sm text-gray-600">Um processo claro, do primeiro contato à entrega.</p>

        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Compromissos de atendimento">
          {SERVICE_COMMITMENTS.map(({ title, description, Icon }) => (
            <li key={title}>
              <Card className="h-full border border-pink-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-pink-600">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                </div>
                <p className="mt-4 text-xs font-light leading-relaxed text-gray-600">{description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
