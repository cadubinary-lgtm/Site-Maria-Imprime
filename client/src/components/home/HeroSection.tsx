import { useState } from "react";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section
      className="w-full relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #fce4ec 50%, #fce4ec 70%, #fff0f5 100%)",
        minHeight: "480px",
      }}
    >
      {/* Blob decorativo rosa no canto direito — igual ao modelo */}
      <div
        className="absolute right-0 top-0 bottom-0 pointer-events-none"
        style={{
          width: "55%",
          background:
            "radial-gradient(ellipse at 80% 50%, #f8bbd0 0%, #fce4ec 40%, transparent 70%)",
          opacity: 0.6,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center" style={{ minHeight: "480px" }}>

          {/* ── LEFT COLUMN ── */}
          <div className="py-14 lg:py-20">

            {/* Título principal — 2 linhas, fonte enorme, quase preta */}
            <h1
              className="font-black leading-none mb-6 text-gray-900"
              style={{
                fontSize: "clamp(2.2rem, 4.5vw, 4rem)",
                letterSpacing: "-0.02em",
                lineHeight: "1.1",
                fontFamily: "'Nunito', 'Inter', sans-serif",
              }}
            >
              Precisou imprimir?<br />
              Pede pra{" "}
              <span style={{ color: "#e91e63" }}>Maria.</span>
            </h1>

            {/* Subtítulo */}
            <p
              className="text-gray-600 mb-8 leading-relaxed"
              style={{ fontSize: "1rem", maxWidth: "420px", fontWeight: 300 }}
            >
              Aqui você encontra tudo o que precisa para divulgar,
              vender e crescer.
            </p>

            {/* Search bar — branca, larga, borda cinza clara */}
            <div className="mb-10" style={{ maxWidth: "480px" }}>
              <div
                className="flex items-center bg-white gap-3 px-5 py-3.5"
                style={{
                  borderRadius: "50px",
                  border: "1.5px solid #e0e0e0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
                  type="text"
                  placeholder="Buscar produtos, materiais ou serviços..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-600 text-sm placeholder-gray-400"
                />
              </div>
            </div>

            {/* ── 4 PILARES — ícones específicos, linha única ── */}
            <div className="flex flex-row items-start gap-6">
              {[
                {
                  label: "RÁPIDA",
                  desc: "Ágil como você precisa",
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="#e91e63" strokeWidth={1.5} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    </svg>
                  ),
                },
                {
                  label: "ATENCIOSA",
                  desc: "Cuida de cada detalhe",
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="#e91e63" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  ),
                },
                {
                  label: "CONFIÁVEL",
                  desc: "Pode contar sempre",
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="#e91e63" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                },
                {
                  label: "SIMPLES",
                  desc: "Fácil, do seu jeito",
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="#e91e63" strokeWidth={1.5} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                    </svg>
                  ),
                },
              ].map((pilar, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">{pilar.icon}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs leading-tight whitespace-nowrap">{pilar.label}</p>
                    <p className="text-gray-500 text-xs leading-tight font-light whitespace-nowrap">{pilar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN — mascote com fundo transparente ── */}
          <div className="hidden lg:flex justify-end items-end h-full relative">
            <img
              src="/manus-storage/mascote-full_457bfb3b.png"
              alt="Maria Imprime - Mascote"
              className="select-none object-contain"
              style={{
                height: "460px",
                width: "auto",
                maxWidth: "500px",
                marginBottom: "-2px",
              }}
              draggable={false}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
