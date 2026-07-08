import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "João Silva",
    profession: "Restaurante",
    text: "Qualidade excelente e produto chegou rápido. Recomendo muito a Maria Imprime.",
    rating: 5,
    avatar: "👨",
  },
  {
    name: "Maria Santos",
    profession: "Loja de Roupas",
    text: "Ficou exatamente como eu queria. Entrega rápida e atendimento perfeito!",
    rating: 5,
    avatar: "👩",
  },
  {
    name: "Carlos Oliveira",
    profession: "Clínica Odontológica",
    text: "Já é a terceira vez que faço pedido. Qualidade consistente e confiável.",
    rating: 5,
    avatar: "👨",
  },
  {
    name: "Ana Costa",
    profession: "Estúdio de Beleza",
    text: "Quantidade excelente e o atendimento da Maria foi muito atencioso!",
    rating: 5,
    avatar: "👩",
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-20 px-4" style={{paddingTop: '39px'}}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-3 text-center text-gray-900">Quem já pediu, aprovou! ❤️</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {TESTIMONIALS.map((testimonial, idx) => (
            <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-all bg-white" style={{paddingTop: '3px'}}>
              <CardContent className="pt-6">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-gray-700 text-xs mb-4 italic leading-relaxed font-light">"{testimonial.text}"</p>

                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="text-2xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">{testimonial.name}</p>
                    <p className="text-xs text-gray-600 font-light">{testimonial.profession}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
