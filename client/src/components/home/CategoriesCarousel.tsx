import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function CategoriesCarousel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [, navigate] = useLocation();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: segments = [] } = trpc.productSegments.getAllSegments.useQuery();

  const updateScrollControls = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 4);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const frame = requestAnimationFrame(updateScrollControls);
    container.addEventListener("scroll", updateScrollControls, { passive: true });
    window.addEventListener("resize", updateScrollControls);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", updateScrollControls);
      window.removeEventListener("resize", updateScrollControls);
    };
  }, [segments.length, updateScrollControls]);

  const handleScroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const firstItem = container.querySelector("button[data-segment-card]") as HTMLElement | null;

    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (isMobile && firstItem) {
      const cards = Array.from(container.querySelectorAll<HTMLElement>("button[data-segment-card]"));
      const viewportCenter = container.scrollLeft + container.clientWidth / 2;
      const currentIndex = cards.reduce((closestIndex, card, index) => {
        const closestCard = cards[closestIndex];
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const closestCenter = closestCard.offsetLeft + closestCard.offsetWidth / 2;
        return Math.abs(cardCenter - viewportCenter) < Math.abs(closestCenter - viewportCenter) ? index : closestIndex;
      }, 0);
      const targetIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + (direction === "left" ? -1 : 1)));
      const targetCard = cards[targetIndex];
      const targetLeft = Math.max(0, Math.min(container.scrollWidth - container.clientWidth, targetCard.offsetLeft - (container.clientWidth - targetCard.offsetWidth) / 2));

      container.scrollTo({ left: targetLeft, behavior: "smooth" });
      return;
    }

    const gap = Number.parseFloat(getComputedStyle(container).gap || "16");
    const distance = firstItem
      ? firstItem.getBoundingClientRect().width + gap
      : Math.max(220, container.clientWidth * 0.75);

    container.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Acesso rápido</h2>

        <div className="relative flex items-center">
          <div className="mx-10 min-w-0 flex-1 sm:mx-12">
            <div
              id="categories-container"
              ref={containerRef}
              className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[calc(50%_-_4.75rem)] py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-1" style={{borderRadius: '33px'}}
            >
              {(segments as any[]).map((segment) => (
                <button
                  key={segment.id}
                  type="button"
                  data-segment-card
                  onClick={() => navigate(`/catalogo?segmentId=${segment.id}`)}
                  className="group w-[9.5rem] shrink-0 snap-center rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 px-4 py-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:from-pink-100 hover:to-pink-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 sm:w-40 sm:snap-start"
                >
                  <span className="flex min-h-9 items-center justify-center gap-2.5">
                    {segment.icon && (
                      <img
                        src={segment.icon}
                        alt=""
                        aria-hidden="true"
                        className="h-7 w-7 shrink-0 object-contain"
                      />
                    )}
                    <span className="text-center text-sm font-semibold leading-tight text-slate-900 transition-colors group-hover:text-pink-700">
                      {segment.name}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {(segments as any[]).length > 4 && (
            <>
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label="Ver categorias anteriores"
                title="Categorias anteriores"
                className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-white shadow-md transition hover:-translate-x-0.5 hover:bg-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:bg-pink-600 disabled:opacity-100 sm:h-10 sm:w-10"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label="Ver próximas categorias"
                title="Próximas categorias"
                className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-white shadow-md transition hover:translate-x-0.5 hover:bg-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:bg-pink-600 disabled:opacity-100 sm:h-10 sm:w-10"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
