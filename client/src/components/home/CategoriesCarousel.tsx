import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function CategoriesCarousel() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isHoveringLeft, setIsHoveringLeft] = useState(false);
  const [isHoveringRight, setIsHoveringRight] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [, navigate] = useLocation();

  // Usar o novo sistema de segmentos (many-to-many) com ID numérico
  const { data: segments = [] } = trpc.productSegments.getAllSegments.useQuery();

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

  // Auto-scroll when hovering over arrows
  useEffect(() => {
    if (isHoveringLeft || isHoveringRight) {
      scrollIntervalRef.current = setInterval(() => {
        const container = document.getElementById("categories-container");
        if (!container) return;

        const scrollAmount = 5;
        const direction = isHoveringLeft ? "left" : "right";
        const newPosition =
          direction === "left"
            ? Math.max(0, scrollPosition - scrollAmount)
            : scrollPosition + scrollAmount;

        container.scrollTo({ left: newPosition, behavior: "smooth" });
        setScrollPosition(newPosition);
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isHoveringLeft, isHoveringRight, scrollPosition]);

  const handleSegmentClick = (segment: any) => {
    // Navegar para o catálogo com o segmento pré-selecionado via ID numérico
    navigate(`/catalogo?segmentId=${segment.id}`);
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
            style={{ scrollbarWidth: "none", height: '74px', marginBottom: '-7px', marginLeft: '50px', marginRight: '49px', marginTop: '-8px', width: '1189px', paddingBottom: '0px', paddingLeft: '33px', paddingRight: '84px', paddingTop: '10px' }}
          >
            {(segments as any[]).map((segment) => (
              <button
                key={segment.id}
                onClick={() => handleSegmentClick(segment)}
                className="flex-shrink-0 group cursor-pointer"
              >
                {/* Card retangular com bordas redondas */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl px-6 py-2 h-14 flex items-center gap-4 hover:shadow-lg transition-all duration-300 min-w-max hover:bg-gradient-to-br hover:from-pink-100 hover:to-pink-200">
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
              </button>
            ))}
          </div>

          {/* Left arrow button - positioned absolutely */}
          {(segments as any[]).length > 4 && (
            <button
              onMouseEnter={() => setIsHoveringLeft(true)}
              onMouseLeave={() => setIsHoveringLeft(false)}
              onClick={() => handleScroll("left")}
              className="absolute left-0 w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center transition-all shadow-md z-10 hover:-translate-x-2"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right arrow button - positioned absolutely */}
          {(segments as any[]).length > 4 && (
            <button
              onMouseEnter={() => setIsHoveringRight(true)}
              onMouseLeave={() => setIsHoveringRight(false)}
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
