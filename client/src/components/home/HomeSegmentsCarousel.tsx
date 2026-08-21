import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const AUTOPLAY_INTERVAL_MS = 5000;

export function HomeSegmentsCarousel() {
  const [, navigate] = useLocation();
  const { data: slides = [] } = trpc.homeCarousel.listPublic.useQuery();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const totalSlides = slides.length;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (activeIndex < totalSlides) return;
    setActiveIndex(0);
  }, [activeIndex, totalSlides]);

  useEffect(() => {
    if (totalSlides < 2 || isPaused || prefersReducedMotion) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % totalSlides), AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion, totalSlides]);

  if (totalSlides === 0) return null;

  const showSlide = (index: number) => setActiveIndex((index + totalSlides) % totalSlides);
  const activeSlide = slides[activeIndex];

  return (
    <section className="bg-white px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="home-carousel-title">
      <div
        className="mx-auto max-w-7xl"
        role="region"
        aria-roledescription="carrossel"
        aria-label="Ofertas por segmento"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
        }}
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-pink-600">Conheça nossos segmentos</p>
            <h2 id="home-carousel-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Encontre a opção certa para o seu projeto</h2>
          </div>
          {totalSlides > 1 && <p className="hidden text-sm text-slate-500 sm:block" aria-live="polite">{activeIndex + 1} de {totalSlides}</p>}
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-pink-100 bg-pink-50 shadow-sm">
          <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[16/6]">
            {slides.map((slide, index) => (
              <article
                key={slide.id}
                aria-roledescription="slide"
                aria-label={`${index + 1} de ${totalSlides}: ${slide.segmentName}`}
                aria-hidden={index !== activeIndex}
                className={`absolute inset-0 transition-[opacity,transform] duration-500 motion-reduce:transition-none ${index === activeIndex ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0 pointer-events-none"}`}
              >
                <img src={slide.imageUrl} alt={`Conheça produtos do segmento ${slide.segmentName}`} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-5 sm:p-8">
                  <p className="text-sm font-semibold text-white drop-shadow-sm sm:text-base">{slide.segmentName}</p>
                  <button type="button" onClick={() => navigate(`/catalogo?segmentId=${slide.segmentId}`)} tabIndex={index === activeIndex ? 0 : -1} className="rounded-full bg-pink-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-pink-700 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-600">Ver opções</button>
                </div>
              </article>
            ))}
          </div>

          {totalSlides > 1 && <>
            <button type="button" onClick={() => showSlide(activeIndex - 1)} aria-label="Ver imagem anterior" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-slate-900 shadow-sm transition hover:bg-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 sm:left-5"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
            <button type="button" onClick={() => showSlide(activeIndex + 1)} aria-label="Ver próxima imagem" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-slate-900 shadow-sm transition hover:bg-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 sm:right-5"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
            <div className="absolute bottom-3 right-4 flex gap-2 sm:bottom-5 sm:right-6" aria-label="Selecionar imagem do carrossel">
              {slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => showSlide(index)} aria-label={`Mostrar imagem ${index + 1}: ${slide.segmentName}`} aria-current={index === activeIndex ? "true" : undefined} className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 ${index === activeIndex ? "w-7 bg-white" : "w-2.5 bg-white/60 hover:bg-white"}`} />)}
            </div>
          </>}
        </div>
        {totalSlides > 1 && <p className="mt-3 text-xs text-slate-500">A reprodução pausa ao passar o mouse ou navegar pelo carrossel.</p>}
      </div>
    </section>
  );
}
