import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function CategoriesCarousel() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isHoveringLeft, setIsHoveringLeft] = useState(false);
  const [isHoveringRight, setIsHoveringRight] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [, navigate] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile (< 768px) sem afetar desktop
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Usar o novo sistema de segmentos (many-to-many) com ID numérico
  const { data: segments = [] } = trpc.productSegments.getAllSegments.useQuery();

  // No mobile: avança exatamente a largura de 1 item visível
  // No desktop: mantém comportamento original (scroll de 300px)
  const handleScroll = useCallback((direction: "left" | "right") => {
    const container = containerRef.current || document.getElementById("categories-container") as HTMLDivElement | null;
    if (!container) return;

    if (isMobile) {
      // Calcular largura de um item para avançar 1 por vez
      const firstItem = container.querySelector("button") as HTMLElement | null;
      const itemWidth = firstItem
        ? firstItem.getBoundingClientRect().width + parseFloat(getComputedStyle(container).gap || "16")
        : container.clientWidth;

      const newPosition =
        direction === "left"
          ? Math.max(0, container.scrollLeft - itemWidth)
          : container.scrollLeft + itemWidth;

      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    } else {
      // Comportamento desktop original — 300px
      const scrollAmount = 300;
      const newPosition =
        direction === "left"
          ? Math.max(0, scrollPosition - scrollAmount)
          : scrollPosition + scrollAmount;

      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  }, [isMobile, scrollPosition]);

  // Auto-scroll ao segurar o mouse nas setas (apenas desktop — hover não existe no mobile)
  useEffect(() => {
    if (!isMobile && (isHoveringLeft || isHoveringRight)) {
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
  }, [isHoveringLeft, isHoveringRight, scrollPosition, isMobile]);

  const handleSegmentClick = (segment: any) => {
    navigate(`/catalogo?segmentId=${segment.id}`);
  };

  return (
    <section className="bg-white py-12 px-6 lg:px-8" style={{paddingBottom: '6px', paddingRight: '23px', paddingTop: '17px'}}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-sm font-semibold text-gray-700 mb-6">Acesso rápido</h2>

        <div className="relative flex items-center" style={{paddingBottom: '8px', paddingLeft: '35px', paddingRight: '15px'}}>
          {/* Scroll container */}
          <div
            id="categories-container"
            ref={containerRef}
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth flex-1 px-28"
            style={{ scrollbarWidth: "none", height: '59px', marginBottom: '-7px', marginLeft: '50px', marginRight: '49px', marginTop: '-8px', width: '1189px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', paddingTop: '2px', borderRadius: '14px' }}
          >
            {(segments as any[]).map((segment) => (
              <button
                key={segment.id}
                onClick={() => handleSegmentClick(segment)}
                className="flex-shrink-0 group cursor-pointer"
              >
                {/* Card retangular com bordas redondas */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl px-4 py-2 h-14 flex items-center justify-center gap-3 hover:shadow-lg transition-all duration-300 hover:bg-gradient-to-br hover:from-pink-100 hover:to-pink-200" style={{ width: '160px', minWidth: '160px', maxWidth: '160px' }}>
                  {segment.icon && (
                    <img
                      src={segment.icon}
                      alt={segment.name}
                      className="w-8 h-8 flex-shrink-0"
                    />
                  )}
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors text-center leading-tight">
                    {segment.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Left arrow button - positioned absolutely */}
          {(segments as any[]).length > 4 && (
            <button
              onMouseEnter={() => !isMobile && setIsHoveringLeft(true)}
              onMouseLeave={() => !isMobile && setIsHoveringLeft(false)}
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
              onMouseEnter={() => !isMobile && setIsHoveringRight(true)}
              onMouseLeave={() => !isMobile && setIsHoveringRight(false)}
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
