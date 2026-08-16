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
    <section className="bg-white py-20 px-4" style={{paddingTop: '39px'}}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-3 text-center text-gray-900">Como cuidamos do seu pedido</h2>
        <p className="text-center text-gray-600 text-sm">Um processo claro, do primeiro contato à entrega.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {SERVICE_COMMITMENTS.map(({ title, description, Icon }) => (
            <Card key={title} className="border-0 shadow-sm hover:shadow-md transition-all bg-white" style={{paddingTop: '3px'}}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-xs mt-4 leading-relaxed font-light">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
