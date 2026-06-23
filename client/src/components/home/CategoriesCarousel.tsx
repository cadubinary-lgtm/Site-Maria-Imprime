import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function CategoriesCarousel() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { data: segments = [] } = trpc.segments.list.useQuery();

  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById("categories-container");
    if (!container) return;

    const scrollAmount = 300;
    const newPosition =
      direction === "left"
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: "smooth" });
    setScrollPosition(newPosition);
  };

  return (
    <section className="bg-white py-12 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-sm font-semibold text-gray-700 mb-6">Acesso rápido</h2>

        <div className="relative flex items-center">
          {/* Scroll container */}
          <div
            id="categories-container"
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth flex-1 px-28"
            style={{ scrollbarWidth: "none", height: '74px', marginBottom: '-7px', marginLeft: '50px', marginRight: '49px', marginTop: '-8px', width: '1189px', paddingBottom: '5px', paddingLeft: '10px', paddingRight: '86px', paddingTop: '9px' }}
          >
            {segments.map((segment: any) => (
              <Link key={segment.id} href={`/produtos?segment=${segment.slug}`}>
                <div className="flex-shrink-0 group cursor-pointer">
                  {/* Card retangular com bordas redondas */}
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl px-6 py-2 h-14 flex items-center gap-4 hover:shadow-lg transition-all duration-300 min-w-max">
                    {segment.icon && (
                      <img
                        src={segment.icon}
                        alt={segment.name}
                        className="w-10 h-10 flex-shrink-0"
                      />
                    )}
                    <span className="text-base font-semibold text-gray-900 group-hover:text-pink-600 transition-colors whitespace-nowrap">
                      {segment.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Left arrow button - positioned absolutely */}
          {segments.length > 4 && (
            <button
              onClick={() => handleScroll("left")}
              className="absolute left-0 w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center transition-all shadow-md z-10 hover:-translate-x-2"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right arrow button - positioned absolutely */}
          {segments.length > 4 && (
            <button
              onClick={() => handleScroll("right")}
              className="absolute right-0 w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center transition-all shadow-md z-10 hover:translate-x-2"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
