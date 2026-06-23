import { useState } from "react";
import { useLocation } from "wouter";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produtos?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative w-full bg-gradient-to-r from-white via-white to-pink-100/40 py-20 px-6 lg:px-24 flex flex-col lg:flex-row items-stretch justify-between min-h-[550px] overflow-hidden">

      {/* Blob decorativo rosa no canto direito */}
      <div
        className="absolute right-0 top-0 bottom-0 pointer-events-none"
        style={{
          width: "50%",
          background: "radial-gradient(ellipse at 85% 50%, #f8bbd0 0%, #fce4ec 40%, transparent 70%)",
          opacity: 0.5,
        }}
      />

      {/* LADO ESQUERDO: TEXTOS E BUSCA */}
      <div className="w-full lg:w-[50%] flex flex-col justify-center z-10 pr-4">
        <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] text-left"
          style={{ fontFamily: "'Corbel', 'Arial Black', 'Nunito', sans-serif" }}
        >
          Precisou imprimir?<br />
          Pede pra <span className="text-[#E91E63]">Maria.</span>
        </h1>

        <p className="text-sm lg:text-base text-slate-500 mt-6 max-w-sm leading-relaxed text-left">
          Aqui você encontra tudo o que precisa para divulgar, vender e crescer.
        </p>

        {/* BARRA DE BUSCA */}
        <form onSubmit={handleSearch} className="relative mt-8 max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produtos, materiais ou serviços..."
            className="w-full pl-12 pr-4 py-4 rounded-full border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 bg-white text-sm"
          />
        </form>

        {/* 4 PILARES */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 mt-12 w-full border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 min-w-[100px]">
            <span className="text-[#E91E63] text-lg">⏱️</span>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">Rápida</span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">Ágil como você precisa</span>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-[100px]">
            <span className="text-[#E91E63] text-lg">❤️</span>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">Atenciosa</span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">Cuida de cada detalhe</span>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-[100px]">
            <span className="text-[#E91E63] text-lg">🛡️</span>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">Confiável</span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">Pode contar sempre</span>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-[100px]">
            <span className="text-[#E91E63] text-lg">😊</span>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">Simples</span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">Fácil, do seu jeito</span>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: MASCOTE GRANDE E ALINHADA */}
      <div className="w-full lg:w-[50%] flex items-end justify-center lg:justify-end mt-10 lg:mt-0 relative z-10">
        <img
          src="/manus-storage/mascote-final_2be4f609.webp"
          alt="Mascote Maria"
          className="w-full max-w-[380px] lg:max-w-[440px] h-auto object-contain bg-transparent lg:absolute lg:bottom-0 lg:right-0"
          draggable={false}
        />
      </div>

    </section>
  );
}
