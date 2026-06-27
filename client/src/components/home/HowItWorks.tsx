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
    <section className="bg-white py-16 px-4 lg:px-8" style={{ minHeight: "573px" }}>
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
            Como funciona
          </h2>
          <div className="w-10 h-1 bg-[#FF0066] mx-auto rounded-full" />
        </div>

        {/* ── Desktop ── */}
        <div className="hidden lg:block">
          {/* Linha única: mascote com bolinha sobreposta + seta entre elas */}
          <div className="flex items-end justify-center" style={{ height: "220px" }}>
            {steps.map((step, i) => (
              <div key={i} className="flex items-end flex-1">
                {/* Wrapper relativo para sobrepor bolinha na cabeça */}
                <div className="flex-1 flex justify-center items-end group relative">
                  {/* Bolinha numérica — posicionada acima da cabeça com pequeno espaço */}
                  <img
                    src={step.number}
                    alt={`Passo ${i + 1}`}
                    className="absolute w-7 h-7 object-contain z-10"
                    style={{ top: "-28px", left: "50%", transform: "translateX(-50%)" }}
                  />
                  {/* Mascote */}
                  <img
                    src={step.mascote}
                    alt={step.title}
                    className="w-[140px] h-auto max-h-[210px] object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Seta entre mascotes */}
                {i < steps.length - 1 && (
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: "32px", marginBottom: "82px" }}
                  >
                    <img
                      src={ARROW_URL}
                      alt="→"
                      className="object-contain opacity-90"
                      style={{ width: "32px", height: "31px" }}
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
        <div className="grid grid-cols-2 gap-6 lg:hidden">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="relative flex justify-center">
                {/* Bolinha acima da cabeça da mascote com pequeno espaço */}
                <img
                  src={step.number}
                  alt={`Passo ${i + 1}`}
                  className="absolute w-8 h-8 object-contain z-10"
                  style={{ top: "-22px", left: "50%", transform: "translateX(-50%)" }}
                />
                <img
                  src={step.mascote}
                  alt={step.title}
                  className="w-[110px] h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="font-bold text-gray-800 text-sm leading-tight mt-2 mb-1">
                {step.title}
              </p>
              <p className="text-gray-500 text-xs leading-snug">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Botão CTA */}
        <div className="flex justify-center mt-12">
          <Link href="/catalogo">
            <button className="bg-[#FF0066] text-white font-bold text-base px-10 py-4 rounded-full shadow-lg shadow-pink-200 transition-all duration-200 hover:bg-[#e0005a] hover:shadow-xl hover:shadow-pink-300 hover:-translate-y-0.5 active:scale-95">
              Fazer meu pedido agora
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
