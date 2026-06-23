import { useState } from "react";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section
      className="w-full bg-pink-50 pt-12 pb-0 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #fff8fa 0%, #fce4ec 60%, #fff5f8 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
          {/* ── LEFT COLUMN ── */}
          <div className="py-12 lg:py-16">
            {/* Title */}
            <h1
              className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight text-gray-900 mb-6"
              style={{ fontFamily: "'Nunito', 'Inter', sans-serif" }}
            >
              Precisou imprimir?
              <br />
              <span className="text-pink-600">Pede pra Maria.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base lg:text-lg text-gray-600 mb-8 leading-relaxed font-light max-w-md">
              Aqui você encontra tudo o que precisa para divulgar, vender e crescer.
            </p>

            {/* Search bar — rounded-full, shadow sutil */}
            <div className="relative max-w-md mb-10">
              <div className="flex items-center bg-white rounded-full shadow-md border border-gray-100 px-5 py-3 gap-3">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
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
                  className="flex-1 bg-transparent outline-none text-gray-700 text-sm placeholder-gray-400"
                />
              </div>
            </div>

            {/* ── 4 PILARES — single row, flex ── */}
            <div className="flex flex-row items-start gap-6">
              {[
                { label: "RÁPIDA", desc: "Ágil e eficiente" },
                { label: "ATENÇÃO", desc: "Cada detalhe" },
                { label: "CONFIÁVEL", desc: "Pode contar" },
                { label: "SIMPLES", desc: "Do seu jeito" },
              ].map((pilar, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  {/* Coração rosa-magenta discreto */}
                  <svg
                    className="w-3.5 h-3.5 text-pink-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <div>
                    <p className="font-bold text-gray-900 text-xs leading-tight whitespace-nowrap">{pilar.label}</p>
                    <p className="text-gray-500 text-xs leading-tight font-light whitespace-nowrap">{pilar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN — mascote sem caixa, sem borda, sem sombra ── */}
          <div className="hidden lg:flex justify-center items-end relative">
            {/* Blob decorativo suave atrás da mascote */}
            <div
              className="absolute inset-0 rounded-full opacity-30 blur-3xl"
              style={{
                background: "radial-gradient(ellipse at center, #f9a8d4 0%, transparent 70%)",
                transform: "scale(1.2)",
              }}
            />
            {/* Placeholder para mascote PNG — sem borda, sem fundo rígido */}
            <div className="relative z-10 flex flex-col items-center justify-end w-full max-w-sm pb-0">
              <div className="flex flex-col items-center justify-center min-h-80 w-full">
                <div className="text-8xl mb-2">👩</div>
                <p className="text-pink-400 text-xs font-light italic text-center px-4">
                  Espaço para mascote PNG com fundo transparente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
