import { Link } from "wouter";
import { useState } from "react";

const CATEGORIES = [
  { name: "Cartão de Visita", icon: "🎴", key: "cartao" },
  { name: "Panfletos", icon: "📄", key: "panfletos" },
  { name: "Adesivos", icon: "⭕", key: "adesivos" },
  { name: "Banners", icon: "🎨", key: "banners" },
  { name: "Fachadas", icon: "🏪", key: "fachadas" },
  { name: "Etiquetas", icon: "🏷️", key: "etiquetas" },
  { name: "Embalagens", icon: "📦", key: "embalagens" },
  { name: "Mais", icon: "➡️", key: "mais" },
];

export function CategoriesCarousel() {
  const [scrollPosition, setScrollPosition] = useState(0);

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("categories-scroll");
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === "left" 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  return (
    <section className="bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">Acesso rápido</h2>

        <div className="relative">
          {/* Scroll container */}
          <div
            id="categories-scroll"
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollBehavior: "smooth" }}
          >
            {CATEGORIES.map((category) => (
              <Link key={category.key} href={`/catalogo?category=${category.key}`}>
                <div className="flex-shrink-0 group cursor-pointer">
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-full w-20 h-20 flex items-center justify-center text-4xl shadow-lg hover:shadow-xl transition-all hover:scale-110 mb-3">
                    {category.icon}
                  </div>
                  <p className="text-center text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                    {category.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Right arrow button */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-pink-600 hover:bg-pink-700 text-white rounded-full p-3 shadow-lg transition-all z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
