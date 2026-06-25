import { Link } from "wouter";

const steps = [
  {
    number: "/manus-storage/NUMERO1_785a9e70.webp",
    mascote: "/manus-storage/mascote1_a9ce1129.webp",
    title: "Escolha seu produto",
    description: "Encontre a opção ideal para seu projeto.",
  },
  {
    number: "/manus-storage/NUMERO2_14456832.webp",
    mascote: "/manus-storage/mascote2_efbd0ee7.webp",
    title: "Envie seu arquivo",
    description: "Faça o upload da arte pronta para impressão.",
  },
  {
    number: "/manus-storage/NUMERO3_31247e8f.webp",
    mascote: "/manus-storage/mascote3_2d5f3bfd.webp",
    title: "Conferência técnica",
    description: "Nossa equipe verifica medidas, resolução e possíveis inconsistências.",
  },
  {
    number: "/manus-storage/NUMERO4_588a745d.webp",
    mascote: "/manus-storage/mascote4_33e46e55.webp",
    title: "Arquivo aprovado para produção",
    description: "Se estiver tudo certo, iniciamos a impressão.",
  },
  {
    number: "/manus-storage/NUMERO5_74d09d11.webp",
    mascote: "/manus-storage/mascote5_4c97b4f5.webp",
    title: "Produção com carinho",
    description: "Seu material entra na fila de produção.",
  },
  {
    number: "/manus-storage/NUMERO6_b8a209c7.webp",
    mascote: "/manus-storage/mascote6_9f16a143.webp",
    title: "Pedido enviado",
    description: "Você acompanha a entrega pelo seu painel.",
  },
];

const ARROW_URL = "/manus-storage/SETA_e3737895.webp";

export function HowItWorks() {
  return (
    <section className="bg-white py-16 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
            Como funciona
          </h2>
          <div className="w-10 h-1 bg-[#FF0066] mx-auto rounded-full" />
        </div>

        {/* Linha de passos */}
        <div className="flex flex-wrap lg:flex-nowrap items-end justify-center gap-0">
          {steps.map((step, index) => (
            <div key={index} className="flex items-end">
              {/* Card do passo */}
              <div className="flex flex-col items-center text-center w-[130px] sm:w-[150px] lg:w-[160px] group">
                {/* Número rosa */}
                <img
                  src={step.number}
                  alt={`Passo ${index + 1}`}
                  className="w-10 h-10 mb-2 object-contain"
                />

                {/* Bonequinha — sem overflow hidden, tamanho natural */}
                <img
                  src={step.mascote}
                  alt={step.title}
                  className="
                    w-[120px] sm:w-[136px] lg:w-[150px]
                    h-auto
                    object-contain
                    transition-transform duration-300 ease-out
                    group-hover:scale-105
                  "
                />

                {/* Texto */}
                <div className="mt-3 px-1">
                  <p className="font-bold text-gray-800 text-sm leading-tight mb-1">
                    {step.title}
                  </p>
                  <p className="text-gray-500 text-xs leading-snug">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Seta entre os passos */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex items-center mb-16 mx-[-6px]">
                  <img
                    src={ARROW_URL}
                    alt="próximo passo"
                    className="w-10 h-10 object-contain opacity-90"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botão CTA */}
        <div className="flex justify-center mt-12">
          <Link href="/catalogo">
            <button className="
              bg-[#FF0066] text-white font-bold text-base px-10 py-4 rounded-full
              shadow-lg shadow-pink-200
              transition-all duration-200
              hover:bg-[#e0005a] hover:shadow-xl hover:shadow-pink-300 hover:-translate-y-0.5
              active:scale-95
            ">
              Fazer meu pedido agora
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
