import { Link } from "wouter";
import { HOME_PRIMARY_ACTION_CLASS } from "@/lib/homeActionStyles";

const MASCOTE = "/manus-storage/mascote7v2_02cfb9a3.webp";
const FUNDO   = "/manus-storage/fundorosa2_7ec48199.webp";
const CHECK   = "/manus-storage/certo_54c281fc.png";

const checks = [
  "Resolução mínima de 300 DPI",
  "Fontes convertidas em curvas",
  "Arquivo em CMYK ou RGB",
  "Cores e contrastes adequados",
  "Sangria e margens corretas",
  "Formato e tamanho conferidos",
];

const FONT = "'Bahnschrift', 'Segoe UI', sans-serif";

export function PrePrintChecklist() {
  return (
    <section className="w-full bg-white px-4 pt-3 pb-5 lg:px-8" aria-label="Conferência de arquivo antes da produção">
      <div className="mx-auto max-w-7xl">
        <div className="relative" style={{ paddingTop: '12px' }}>

          {/* ── CARD ROSA ── */}
          <div
            className="relative rounded-3xl overflow-visible"
            style={{
              backgroundImage: `url(${FUNDO})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "#fdf0f5",
            }}
          >

            {/* ══════════════════════════════════════════
                DESKTOP / TABLET (md+) — layout original
                Mascote absoluta à esquerda, conteúdo à direita
            ══════════════════════════════════════════ */}
            <div className="hidden md:flex flex-row items-stretch" style={{ minHeight: "300px" }}>
              {/* Espaço reservado para a mascote */}
              <div className="flex-shrink-0" style={{ width: "280px" }} />

              {/* Conteúdo */}
              <div className="flex-1 py-10" style={{
                paddingLeft: 'clamp(1rem, 5vw, 165px)',
                paddingRight: 'clamp(1rem, 5vw, 45px)',
                paddingTop: '47px',
                paddingBottom: '10px',
              }}>
                <h2 className="mb-2 text-2xl font-black leading-tight text-gray-900 lg:text-3xl" style={{ fontFamily: FONT }}>
                  Antes de imprimir,{" "}
                  <span style={{ color: "#E6005C" }}>nós verificamos!</span>
                </h2>
                <p className="text-gray-600 text-sm lg:text-base mb-6" style={{ fontFamily: FONT }}>
                  Nossa equipe confere cada detalhe do seu arquivo antes de enviar para produção.
                </p>
                <ul className="grid grid-cols-2 gap-3 md:gap-4" aria-label="Itens conferidos no arquivo">
                  {checks.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 md:gap-3">
                      <img src={CHECK} alt="" aria-hidden="true" className="mt-0.5 h-7 w-7 shrink-0 object-contain" />
                      <span className="text-gray-800 text-sm lg:text-base font-medium leading-snug" style={{ fontFamily: FONT }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/documentos/normas-envio-arte" className={`${HOME_PRIMARY_ACTION_CLASS} mt-7 w-fit`}>
                  Ver normas para envio de arte
                </Link>
              </div>
            </div>

            {/* Mascote desktop — posicionada absolutamente */}
            <img
              src={MASCOTE}
              alt=""
              aria-hidden="true"
              className="hidden md:block absolute object-contain object-bottom drop-shadow-lg pointer-events-none"
              style={{
                width: "auto",
                bottom: 0,
                left: "0px",
                top: "-80px",
                height: "calc(100% + 80px)",
                maxHeight: "none",
                objectFit: "contain",
                objectPosition: "bottom",
              }}
              draggable={false}
            />

            {/* ══════════════════════════════════════════
                MOBILE (<md) — layout da imagem enviada:
                1. Título + subtítulo no topo
                2. Mascote à esquerda + grid 2 colunas à direita
            ══════════════════════════════════════════ */}
            <div className="md:hidden px-5 pt-6 pb-6">
              {/* Título */}
              <h2 className="mb-2 text-2xl font-black leading-tight text-gray-900" style={{ fontFamily: FONT }}>
                Antes de imprimir,{" "}
                <span style={{ color: "#E6005C" }}>nós verificamos!</span>
              </h2>
              {/* Subtítulo */}
              <p className="text-gray-600 text-sm mb-5" style={{ fontFamily: FONT }}>
                Nossa equipe confere cada detalhe do seu arquivo antes de enviar para produção.
              </p>

              {/* Mascote + checks lado a lado */}
              <div className="flex items-center gap-2">
                {/* Mascote maior — ~40% da largura */}
                <div className="flex-shrink-0" style={{ width: "42%" }}>
                  <img
                    src={MASCOTE}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-auto object-contain drop-shadow-lg"
                    draggable={false}
                  />
                </div>

                {/* Grid 2 colunas de checks — texto bem pequeno */}
                <ul className="grid flex-1 grid-cols-2 gap-x-2 gap-y-2" aria-label="Itens conferidos no arquivo">
                  {checks.map((item, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <img src={CHECK} alt="" aria-hidden="true" className="mt-0.5 shrink-0 object-contain" style={{width: '14px', height: '14px'}} />
                      <span style={{ fontFamily: FONT, fontSize: '10px', lineHeight: '1.3', color: '#1f2937', fontWeight: 500 }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/documentos/normas-envio-arte" className={`${HOME_PRIMARY_ACTION_CLASS} mt-5 w-fit`}>
                Ver normas para envio de arte
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
