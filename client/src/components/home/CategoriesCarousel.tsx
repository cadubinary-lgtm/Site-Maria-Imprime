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
          <div
            id="categories-container"
            ref={containerRef}
            className="flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 py-1 sm:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {(segments as any[]).map((segment) => (
              <button
                key={segment.id}
                type="button"
                data-segment-card
                onClick={() => navigate(`/catalogo?segmentId=${segment.id}`)}
                className="group w-[9.5rem] shrink-0 snap-start rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 px-4 py-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:from-pink-100 hover:to-pink-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 sm:w-40"
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

          {(segments as any[]).length > 4 && (
            <>
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label="Ver categorias anteriores"
                title="Categorias anteriores"
                className="absolute left-0 hidden h-10 w-10 items-center justify-center rounded-full bg-pink-600 text-white shadow-md transition hover:-translate-x-0.5 hover:bg-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-0 sm:flex"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label="Ver próximas categorias"
                title="Próximas categorias"
                className="absolute right-0 hidden h-10 w-10 items-center justify-center rounded-full bg-pink-600 text-white shadow-md transition hover:translate-x-0.5 hover:bg-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-0 sm:flex"
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
