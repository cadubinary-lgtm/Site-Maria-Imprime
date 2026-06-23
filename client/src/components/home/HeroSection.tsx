import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="relative bg-white overflow-hidden pt-16 pb-24">
      {/* Gradiente fluido de fundo - rosa pastel orgânico */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-bl from-pink-100 via-pink-50 to-transparent rounded-full blur-3xl opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="pt-8">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gray-900 tracking-tight">
              Precisou imprimir?<br />
              <span className="text-pink-600 font-black">Pede pra Maria.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
              Aqui você encontra tudo o que precisa para divulgar, vender e crescer.
            </p>

            {/* Search bar - minimalista */}
            <div className="mb-10">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Buscar produtos, materiais ou serviços..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700 bg-white shadow-sm transition-all"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 4 Pilares - alinhamento horizontal com corações rosa-magenta */}
            <div className="flex flex-wrap gap-6 lg:gap-8">
              {[
                { label: "RÁPIDA", desc: "Ágil como você precisa" },
                { label: "ATENÇÃO", desc: "Cuida de tudo com detalhe" },
                { label: "CONFIÁVEL", desc: "Pode contar sempre" },
                { label: "SIMPLES", desc: "Fácil do seu jeito" },
              ].map((pilar, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {/* Pequeno coração rosa-magenta discreto */}
                  <div className="flex-shrink-0 pt-0.5">
                    <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{pilar.label}</p>
                    <p className="text-xs text-gray-600 font-light">{pilar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Mascote placeholder */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative w-full max-w-sm">
              {/* Placeholder para mascote - sem borda rígida, apenas espaço suave */}
              <div className="bg-gradient-to-br from-pink-50 to-white rounded-3xl p-12 flex items-center justify-center min-h-96 border border-pink-100 shadow-sm">
                <div className="text-center">
                  <div className="text-6xl mb-4">👩</div>
                  <p className="text-gray-600 font-semibold text-lg">Maria</p>
                  <p className="text-gray-500 text-sm mt-2">Mascote PNG será adicionada aqui</p>
                  <p className="text-gray-400 text-xs mt-4 italic">Espaço reservado para imagem com fundo transparente</p>
                </div>
              </div>

              {/* Decorative elements - mais suaves */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-pink-100 rounded-full opacity-20 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-50 rounded-full opacity-20 blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
