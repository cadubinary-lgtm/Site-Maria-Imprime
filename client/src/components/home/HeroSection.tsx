import { useState } from "react";

// Ícones enviados pelo usuário
const ICON_RAPIDA = "/manus-storage/icone6_2b9ca331.png";       // cronômetro
const ICON_ATENCIOSA = "/manus-storage/icone7_ddf5047c.png";    // coração
const ICON_CONFIAVEL = "/manus-storage/icone8_ed12432c.png";    // escudo check
const ICON_SIMPLES = "/manus-storage/icone9_18e190d5.png";      // smile
const FUNDO_ROSA = "/manus-storage/fundorosahome_45d5872d.webp"; // fundo rosa blob
const MASCOTE = "/manus-storage/mascote-maria-v2_e85aa588.png";

const pilares = [
  { icon: ICON_RAPIDA,    label: "RÁPIDA",     desc: "Ágil como você precisa" },
  { icon: ICON_ATENCIOSA, label: "ATENCIOSA",  desc: "Cuida de cada detalhe" },
  { icon: ICON_CONFIAVEL, label: "CONFIÁVEL",  desc: "Pode contar sempre" },
  { icon: ICON_SIMPLES,   label: "SIMPLES",    desc: "Fácil, do seu jeito" },
];

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section
      className="w-full relative overflow-hidden"
      style={{ minHeight: "480px", backgroundColor: "#ffffff" }}
    >
      {/* Fundo rosa blob — imagem do usuário, cobre a metade direita */}
      <img
        src={FUNDO_ROSA}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity: 1 }}
        draggable={false}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center"
          style={{ minHeight: "480px" }}
        >

          {/* ── COLUNA ESQUERDA ── */}
          <div className="py-14 lg:py-20">

            {/* Título principal — tipografia bold preta + "Maria." rosa */}
            <h1
              className="font-black leading-none mb-5 text-gray-900"
              style={{
                fontSize: "clamp(2.4rem, 4.8vw, 4.2rem)",
                letterSpacing: "-0.02em",
                lineHeight: "1.1",
                fontFamily: "'Nunito', 'Poppins', 'Arial Black', sans-serif",
                fontWeight: 900,
              }}
            >
              Precisou imprimir?<br />
              Pede pra{" "}
              <span style={{ color: "#e91e63" }}>Maria.</span>
            </h1>

            {/* Subtítulo */}
            <p
              className="text-gray-600 mb-8 leading-relaxed"
              style={{
                fontSize: "1.05rem",
                maxWidth: "420px",
                fontWeight: 400,
                fontFamily: "'Nunito', 'Poppins', sans-serif",
              }}
            >
              Aqui você encontra tudo o que precisa para divulgar,<br />
              vender e crescer.
            </p>

            {/* Barra de busca */}
            <div className="mb-10" style={{ maxWidth: "480px" }}>
              <div
                className="flex items-center bg-white gap-3 px-5 py-3.5"
                style={{
                  borderRadius: "50px",
                  border: "1.5px solid #e0e0e0",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                }}
              >
                <svg
                  className="flex-shrink-0 text-gray-400"
                  style={{ width: "18px", height: "18px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  placeholder="Buscar produtos, materiais ou serviços…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-600 text-sm placeholder-gray-400"
                />
              </div>
            </div>

            {/* 4 Pilares com ícones reais */}
            <div className="flex flex-row items-start gap-4" style={{ flexWrap: 'nowrap' }}>
              {pilares.map((pilar, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <img
                    src={pilar.icon}
                    alt={pilar.label}
                    className="flex-shrink-0 mt-0.5"
                    style={{ width: "32px", height: "32px", objectFit: "contain" }}
                  />
                  <div>
                    <p
                      className="font-bold text-gray-900 text-sm leading-tight whitespace-nowrap"
                      style={{ fontFamily: "'Nunito', 'Poppins', sans-serif", fontWeight: 800 }}
                    >
                      {pilar.label}
                    </p>
                    <p
                      className="text-gray-500 text-xs leading-tight whitespace-nowrap"
                      style={{ fontFamily: "'Nunito', 'Poppins', sans-serif", fontWeight: 400 }}
                    >
                      {pilar.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ── COLUNA DIREITA — mascote ── */}
          <div className="hidden lg:flex justify-end items-end h-full relative">
            <img
              src={MASCOTE}
              alt="Maria Imprime - Mascote"
              className="select-none object-contain"
              style={{
                height: "520px",
                width: "auto",
                maxWidth: "500px",
                marginBottom: "0px",
              }}
              draggable={false}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
