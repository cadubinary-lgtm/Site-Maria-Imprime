import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="bg-gradient-to-br from-pink-50 to-white py-20 px-4 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-100 rounded-full opacity-30 -mr-48 -mt-48" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gray-900">
              Precisou imprimir?<br />
              <span className="text-pink-600">Pede pra Maria.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Aqui você encontra tudo o que precisa para divulgar, vender e crescer.
            </p>

            {/* Search bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar produtos, materiais ou serviços..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-700"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 4 Pillars */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">RÁPIDA</p>
                  <p className="text-xs text-gray-600">Ágil como você precisa</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">ATENÇÃO</p>
                  <p className="text-xs text-gray-600">Cuida de tudo com detalhe</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">CONFIÁVEL</p>
                  <p className="text-xs text-gray-600">Pode contar sempre</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">SIMPLES</p>
                  <p className="text-xs text-gray-600">Fácil do seu jeito</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Mascote placeholder */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative w-full max-w-sm">
              {/* Placeholder for mascote image */}
              <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-3xl p-8 shadow-xl border-4 border-pink-200 flex items-center justify-center min-h-96">
                <div className="text-center">
                  <div className="text-6xl mb-4">👩</div>
                  <p className="text-gray-600 font-semibold text-lg">Maria</p>
                  <p className="text-gray-500 text-sm mt-2">Mascote PNG será adicionada aqui</p>
                  <p className="text-gray-400 text-xs mt-4 italic">Espaço reservado para imagem com fundo transparente</p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-pink-200 rounded-full opacity-20" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-100 rounded-full opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
