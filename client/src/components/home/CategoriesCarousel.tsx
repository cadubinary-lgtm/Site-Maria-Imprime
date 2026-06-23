import { Link } from "wouter";
import type { ReactElement } from "react";

// SVG icons — outline, traço fino, branco
const ICONS: Record<string, ReactElement> = {
  cartao: (
    <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20" />
    </svg>
  ),
  panfletos: (
    <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  adesivos: (
    <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.5} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  banners: (
    <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v12H3zM8 21h8M12 15v6" />
    </svg>
  ),
  fachadas: (
    <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
    </svg>
  ),
  etiquetas: (
    <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 3h8l10 10a2 2 0 010 2.828l-5.172 5.172a2 2 0 01-2.828 0L3 11V3z" />
    </svg>
  ),
  embalagens: (
    <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  mais: (
    <svg className="w-7 h-7" fill="none" stroke="white" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

const CATEGORIES = [
  { name: "Cartão de Visita", key: "cartao" },
  { name: "Panfletos", key: "panfletos" },
  { name: "Adesivos", key: "adesivos" },
  { name: "Banners", key: "banners" },
  { name: "Fachadas", key: "fachadas" },
  { name: "Etiquetas", key: "etiquetas" },
  { name: "Embalagens", key: "embalagens" },
  { name: "Mais", key: "mais" },
];

export function CategoriesCarousel() {
  return (
    <section className="bg-white py-10 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <p className="text-sm font-semibold text-gray-700 mb-6">Acesso rápido</p>

        <div className="relative flex items-center gap-1">
          {/* Scroll container */}
          <div
            id="categories-scroll"
            className="flex gap-6 overflow-x-auto pb-2 scroll-smooth flex-1"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((category) => (
              <Link key={category.key} href={`/catalogo?category=${category.key}`}>
                <div className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group">
                  {/* Círculo maior, rosa suave, ícone outline branco */}
                  <div className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md"
                    style={{ background: "linear-gradient(135deg, #e91e63 0%, #f06292 100%)" }}
                  >
                    {ICONS[category.key]}
                  </div>
                  <p className="text-center text-xs font-medium text-gray-800 group-hover:text-pink-600 transition-colors w-20 leading-tight">
                    {category.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Arrow button */}
          <button
            onClick={() => {
              const el = document.getElementById("categories-scroll");
              if (el) el.scrollBy({ left: 320, behavior: "smooth" });
            }}
            className="flex-shrink-0 ml-2 w-10 h-10 rounded-full border-2 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white flex items-center justify-center transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
