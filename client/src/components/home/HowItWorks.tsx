import { Link } from "wouter";

import { HOME_PRIMARY_ACTION_CLASS } from "@/lib/homeActionStyles";

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
    <section className="bg-white px-4 py-8 lg:px-8 lg:py-16" aria-labelledby="how-it-works-title">
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <div className="text-center mb-6 lg:mb-10">
          <h2 id="how-it-works-title" className="mb-3 text-2xl font-bold text-gray-800 lg:text-4xl">
            Como funciona
          </h2>
          <div className="w-10 h-1 bg-[#FF0066] mx-auto rounded-full" />
        </div>

        {/* ── Desktop ── */}
        <div className="hidden lg:block">
          {/* Linha única: mascote com bolinha sobreposta + seta entre elas */}
          <div className="flex min-h-[220px] items-end justify-center" role="list" aria-label="Etapas do seu pedido">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-1 items-end" role="listitem">
                {/* Wrapper relativo para sobrepor bolinha na cabeça */}
                <div className="flex-1 flex justify-center items-end group relative">
                  {/* Bolinha numérica — posicionada acima da cabeça com pequeno espaço */}
                  <img
                    src={step.number}
                    alt=""
                    aria-hidden="true"
                    className="absolute w-7 h-7 object-contain z-10"
                    style={{ top: "-40px", left: "50%", transform: "translateX(-50%)" }}
                  />
                  {/* Mascote */}
                  <img
                    src={step.mascote}
                    alt=""
                    aria-hidden="true"
                    className="h-auto max-h-[210px] w-[140px] object-contain object-bottom transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                  />
                </div>

                {/* Seta entre mascotes */}
                {i < steps.length - 1 && (
                  <div
                    className="mb-[82px] flex w-8 shrink-0 items-center justify-center"
                  >
                    <img
                      src={ARROW_URL}
                      alt=""
                      aria-hidden="true"
                      className="h-8 w-8 object-contain opacity-90"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Textos */}
          <div className="grid grid-cols-6 mt-4">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center px-2">
                <p className="font-bold text-gray-800 text-sm leading-tight mb-1">
                  {step.title}
                </p>
                <p className="text-gray-500 text-xs leading-snug">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mobile ── */}
        <div className="grid grid-cols-2 gap-3 lg:hidden" role="list" aria-label="Etapas do seu pedido">
          {steps.map((step, i) => (
            <div key={i} role="listitem" className="group flex flex-col items-center pb-2 pt-8 text-center">
              <div className="relative flex min-h-[140px] justify-center">
                {/* Bolinha posicionada dentro do container, no topo — sem sobrepor conteúdo acima */}
                <img
                  src={step.number}
                  alt=""
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 z-10 h-7 w-7 -translate-x-1/2 object-contain"
                />
                {/* Mascote com margem para não ficar atrás da bolinha */}
                <img
                  src={step.mascote}
                  alt=""
                  aria-hidden="true"
                  className="mt-7 h-auto w-[90px] object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                />
              </div>
              <p className="font-bold text-gray-800 text-xs leading-tight mt-1 mb-0.5">
                {step.title}
              </p>
              <p className="text-gray-500 text-xs leading-snug">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Botão CTA */}
        <div className="flex justify-center mt-6 lg:mt-12">
          <Link href="/catalogo" className={`${HOME_PRIMARY_ACTION_CLASS} px-7 sm:px-8`}>
            Fazer meu pedido
          </Link>
        </div>
      </div>
    </section>
  );
}
