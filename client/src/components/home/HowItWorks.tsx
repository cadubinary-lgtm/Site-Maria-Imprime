import { Link } from "wouter";

// scale: fator de zoom extra para imagens paisagem (2:1) que ficam menores em altura
const steps = [
  {
    number: "/manus-storage/NUMERO1_785a9e70.webp",
    mascote: "/manus-storage/mascote1_dead24a9.webp",
    title: "Escolha seu produto",
    description: "Encontre a opção ideal para seu projeto",
    scale: "scale-100",
  },
  {
    number: "/manus-storage/NUMERO2_14456832.webp",
    mascote: "/manus-storage/mascote2_c744e916.webp",
    title: "Envie seu arquivo",
    description: "Faça o upload da arte pronta para impressão",
    scale: "scale-[1.55]", // paisagem 1536x1024 → precisa de zoom para preencher a altura
  },
  {
    number: "/manus-storage/NUMERO3_31247e8f.webp",
    mascote: "/manus-storage/mascote3_21810538.webp",
    title: "Conferência técnica",
    description: "Nossa equipe verifica medidas, resolução e possíveis inconsistências",
    scale: "scale-100",
  },
  {
    number: "/manus-storage/NUMERO4_588a745d.webp",
    mascote: "/manus-storage/mascote4_914dbb3a.webp",
    title: "Arquivo aprovado para produção",
    description: "Se estiver tudo certo iniciamos a impressão",
    scale: "scale-[1.55]", // paisagem 1536x1024 → mesmo ajuste
  },
  {
    number: "/manus-storage/NUMERO5_74d09d11.webp",
    mascote: "/manus-storage/mascote5_de716367.webp",
    title: "Produção com carinho",
    description: "Seu material entra na fila de produção",
    scale: "scale-100",
  },
  {
    number: "/manus-storage/NUMERO6_b8a209c7.webp",
    mascote: "/manus-storage/mascote6_715d14ab.webp",
    title: "Pedido enviado / Pronto para retirada",
    description: "Você acompanha o pedido online",
    scale: "scale-100",
  },
];

const ARROW_URL = "/manus-storage/SETA_e3737895.webp";

export function HowItWorks() {
  return (
    <section className="bg-white py-16 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
            Como funciona
          </h2>
          <div className="w-16 h-1 bg-[#FF0066] mx-auto rounded-full" />
        </div>

        {/* Linha de passos */}
        <div className="flex flex-wrap justify-center gap-0">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start">
              {/* Card do passo */}
              <div className="flex flex-col items-center text-center w-[130px] sm:w-[150px] lg:w-[160px] group cursor-default">
                {/* Número */}
                <img
                  src={step.number}
                  alt={`Passo ${index + 1}`}
                  className="w-10 h-10 mb-1 object-contain"
                />

                {/* Container da bonequinha — tamanho fixo, overflow hidden para o zoom não vazar */}
                <div className="w-[120px] h-[120px] sm:w-[136px] sm:h-[136px] lg:w-[148px] lg:h-[148px] flex items-center justify-center overflow-hidden">
                  <img
                    src={step.mascote}
                    alt={step.title}
                    className={`
                      w-full h-full object-cover
                      ${step.scale}
                      transition-transform duration-300 ease-out
                      group-hover:scale-[1.15]
                    `}
                    style={
                      step.scale !== "scale-100"
                        ? { objectPosition: "center center" }
                        : undefined
                    }
                  />
                </div>

                {/* Texto */}
                <div className="mt-2 px-1">
                  <p className="font-bold text-gray-800 text-sm leading-tight mb-1">
                    {step.title}
                  </p>
                  <p className="text-gray-500 text-xs leading-snug">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Seta entre os passos (apenas desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex items-center mt-12 mx-[-4px]">
                  <img
                    src={ARROW_URL}
                    alt="próximo passo"
                    className="w-10 h-10 object-contain opacity-80"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botão CTA */}
        <div className="flex justify-center mt-14">
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
