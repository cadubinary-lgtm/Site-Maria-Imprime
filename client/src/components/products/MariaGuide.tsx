import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, CircleHelp, Crop, Layers3, Package, Printer, Sparkles, Truck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { parseMariaGuideContent, type MariaGuideContent, type MariaGuideIconKey, type MariaGuideIllustration, type MariaGuideItem, type MariaGuideSection } from "@/lib/mariaGuide";

const guideIcons: Record<MariaGuideIconKey, typeof Printer> = {
  printer: Printer,
  layers: Layers3,
  crop: Crop,
  truck: Truck,
  sparkles: Sparkles,
  package: Package,
};

function TechnicalIllustration({ kind }: { kind: MariaGuideIllustration }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const accent = "#ec1174";
  const visualByKind: Record<MariaGuideIllustration, React.ReactNode> = {
    "lona-ilhos": <><rect x="28" y="32" width="124" height="82" rx="4" {...common} /><circle cx="39" cy="43" r="5" {...common} /><circle cx="141" cy="43" r="5" {...common} /><circle cx="39" cy="103" r="5" {...common} /><circle cx="141" cy="103" r="5" {...common} /><path d="M142 43h30M152 52l-10-9 10-9" stroke={accent} strokeWidth="2" fill="none" /><text x="105" y="27" fontSize="10" fill={accent}>ilhós</text><path d="M28 118h124" stroke={accent} strokeWidth="3" /></>,
    "lona-bastao": <><rect x="38" y="38" width="104" height="72" rx="3" {...common} /><path d="M30 32h120M30 116h120" {...common} /><circle cx="28" cy="32" r="4" {...common} /><circle cx="152" cy="32" r="4" {...common} /><circle cx="28" cy="116" r="4" {...common} /><circle cx="152" cy="116" r="4" {...common} /><path d="M53 22v-12M53 10h35" stroke={accent} strokeWidth="2" /><text x="92" y="15" fontSize="10" fill={accent}>bastão</text></>,
    "adesivo-perfurado": <><rect x="30" y="32" width="118" height="80" rx="4" {...common} /><path d="M30 70h118" {...common} /><circle cx="56" cy="53" r="2" fill="currentColor" /><circle cx="70" cy="53" r="2" fill="currentColor" /><circle cx="84" cy="53" r="2" fill="currentColor" /><circle cx="98" cy="53" r="2" fill="currentColor" /><circle cx="112" cy="53" r="2" fill="currentColor" /><circle cx="126" cy="53" r="2" fill="currentColor" /><path d="M44 87c12-10 24-10 36 0-12 10-24 10-36 0Z" {...common} /><circle cx="62" cy="87" r="4" {...common} /><path d="M116 88h40" stroke={accent} strokeWidth="2" /><text x="111" y="102" fontSize="10" fill={accent}>visão</text></>,
    "papel-gramatura": <><path d="M37 48 123 28l28 18-86 20Z" {...common} /><path d="M37 62 123 42l28 18-86 20Z" {...common} /><path d="M37 76 123 56l28 18-86 20Z" {...common} /><path d="M38 95h102" stroke={accent} strokeWidth="2" /><text x="53" y="112" fontSize="10" fill={accent}>camadas e gramatura</text></>,
    placa: <><rect x="42" y="28" width="96" height="88" rx="4" {...common} /><path d="M64 116v20M116 116v20M54 136h20M106 136h20" {...common} /><path d="M60 50h60M60 68h42" stroke={accent} strokeWidth="3" /><circle cx="52" cy="38" r="3" {...common} /><circle cx="128" cy="38" r="3" {...common} /></>,
    laminacao: <><path d="M30 78 118 50l30 18-88 28Z" {...common} /><path d="M30 62 118 34l30 18-88 28Z" stroke={accent} strokeWidth="2" fill="none" /><path d="M38 54 118 28l20 12" {...common} /><path d="M130 35h34" stroke={accent} strokeWidth="2" /><text x="116" y="28" fontSize="10" fill={accent}>filme</text></>,
    "meio-corte": <><rect x="36" y="35" width="112" height="70" rx="4" {...common} /><path d="M36 76h112" stroke={accent} strokeWidth="2" strokeDasharray="5 4" /><path d="M64 35v41M119 35v41" {...common} /><path d="M52 118h80" {...common} /><text x="56" y="132" fontSize="10" fill={accent}>corte + liner</text></>,
    "vinco-dobra": <><path d="M40 36h104v74H40z" {...common} /><path d="M92 36v74" stroke={accent} strokeWidth="2" strokeDasharray="5 4" /><path d="M50 48 76 68M134 48 108 68" {...common} /><path d="M59 124 92 103l33 21" {...common} /><text x="74" y="142" fontSize="10" fill={accent}>vinco e dobra</text></>,
    entrega: <><path d="M30 91h92V52H81L68 70H30z" {...common} /><path d="M122 70h22l14 18v3h-36" {...common} /><circle cx="58" cy="96" r="10" {...common} /><circle cx="137" cy="96" r="10" {...common} /><path d="M36 36h80" stroke={accent} strokeWidth="2" /><path d="M100 26l16 10-16 10" stroke={accent} strokeWidth="2" fill="none" /></>,
  };
  return <svg viewBox="0 0 190 152" className="h-44 w-full text-slate-950" aria-hidden>{visualByKind[kind]}</svg>;
}

function GuideIcon({ name, className = "h-7 w-7" }: { name: MariaGuideIconKey; className?: string }) {
  const Icon = guideIcons[name] || CircleHelp;
  return <Icon className={className} aria-hidden />;
}

function getFirstActiveItem(section: MariaGuideSection) {
  return section.categories.find((category) => category.isActive)?.items.find((item) => item.isActive) ?? null;
}

export function MariaGuide({ content }: { content?: MariaGuideContent }) {
  const { data } = trpc.siteContent.getPublicMariaGuide.useQuery(undefined, { staleTime: 60_000, enabled: !content });
  const guide = useMemo(() => content ?? parseMariaGuideContent(data?.publishedContent), [content, data?.publishedContent]);
  const sections = guide.sections.filter((section) => section.isActive);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "impressao");
  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const categories = activeSection?.categories.filter((category) => category.isActive) ?? [];
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? categories[0];
  const visibleItems = activeCategory?.items.filter((item) => item.isActive) ?? [];
  const [selectedItemId, setSelectedItemId] = useState<string | null>(visibleItems[0]?.id ?? null);
  const selectedItem: MariaGuideItem | null = visibleItems.find((item) => item.id === selectedItemId) ?? getFirstActiveItem(activeSection ?? guide.sections[0]) ?? null;

  useEffect(() => {
    if (!sections.some((section) => section.id === activeSectionId)) setActiveSectionId(sections[0]?.id ?? "impressao");
  }, [activeSectionId, sections]);

  useEffect(() => {
    setActiveCategoryId(categories[0]?.id ?? "");
  }, [activeSectionId]);

  useEffect(() => {
    setSelectedItemId(visibleItems[0]?.id ?? null);
  }, [activeCategoryId, activeSectionId]);

  if (!activeSection) return null;

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-[0_16px_48px_rgba(236,17,116,0.07)]" aria-labelledby="maria-guide-title">
      <header className="border-b border-pink-100 bg-gradient-to-r from-pink-50 via-white to-white px-5 py-7 sm:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-3 py-1 text-xs font-bold text-pink-600"><Sparkles className="h-3.5 w-3.5" />{guide.eyebrow}</p><h2 id="maria-guide-title" className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{guide.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{guide.description}</p></div>
          <p className="max-w-xs text-sm leading-6 text-slate-500"><span className="font-bold text-pink-600">Leitura orientativa.</span> As opções disponíveis continuam sendo definidas no configurador do produto.</p>
        </div>
      </header>

      <div className="grid border-b border-pink-100 sm:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => {
          const isSelected = section.id === activeSection.id;
          return <button key={section.id} type="button" onClick={() => setActiveSectionId(section.id)} className={`group min-h-28 border-b border-r border-pink-100 p-5 text-left transition last:border-r-0 sm:nth-[2n]:border-r-0 sm:nth-[n+3]:border-b-0 xl:border-b-0 xl:nth-[2n]:border-r xl:last:border-r-0 ${isSelected ? "bg-pink-50/80 shadow-[inset_0_-3px_0_#ec1174]" : "bg-white hover:bg-pink-50/40"}`} aria-pressed={isSelected}>
            <div className="flex items-start gap-3"><div className={`rounded-xl p-2.5 ${isSelected ? "bg-pink-600 text-white" : "bg-pink-50 text-pink-600"}`}><GuideIcon name={section.icon} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-extrabold text-slate-950">{section.title}</h3><ChevronRight className={`h-4 w-4 text-pink-500 transition-transform ${isSelected ? "rotate-90" : "group-hover:translate-x-0.5"}`} /></div><p className="mt-1 text-xs leading-5 text-slate-600">{section.subtitle}</p></div></div>
          </button>;
        })}
      </div>

      <div className="bg-[#fffdfd] p-5 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-pink-100 bg-pink-50/60 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl bg-white p-2.5 text-pink-600 shadow-sm"><GuideIcon name={activeSection.icon} className="h-6 w-6" /></div><div><h3 className="text-xl font-black text-slate-950">{activeSection.title}</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{activeSection.description}</p></div></div><div className="max-w-md rounded-xl border border-pink-100 bg-white px-4 py-3 text-sm leading-5 text-slate-600"><span className="font-bold text-pink-600">Dica da Maria:</span> {activeSection.tip}</div></div>

        <div className={`grid gap-5 ${categories.length > 1 ? "lg:grid-cols-[220px_minmax(0,1fr)]" : ""}`}>
          {categories.length > 1 && <aside className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Categorias do guia">{categories.map((category) => <button key={category.id} type="button" onClick={() => setActiveCategoryId(category.id)} className={`min-w-[180px] rounded-xl border px-4 py-3 text-left transition lg:min-w-0 ${category.id === activeCategory?.id ? "border-pink-300 bg-pink-50 text-pink-700 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-pink-200 hover:bg-pink-50/40"}`}><span className="block text-sm font-extrabold">{category.title}</span><span className="mt-1 block text-xs leading-4 text-slate-500">{category.description}</span></button>)}</aside>}

          <div className="min-w-0"><div className="mb-4"><p className="text-sm font-extrabold text-slate-950">{activeCategory?.title}</p><p className="mt-1 text-sm text-slate-600">{activeCategory?.description}</p></div><div className={`grid gap-3 ${activeSection.id === "acabamento" ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"}`}>{visibleItems.map((item) => <button key={item.id} type="button" onClick={() => setSelectedItemId(item.id)} className={`rounded-2xl border p-4 text-left transition ${item.id === selectedItem?.id ? "border-pink-300 bg-pink-50/70 shadow-sm" : "border-slate-200 bg-white hover:border-pink-200 hover:bg-pink-50/30"}`}><div className="flex gap-3"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.id === selectedItem?.id ? "bg-pink-600 text-white" : "bg-pink-50 text-pink-600"}`}><Check className="h-3.5 w-3.5" /></span><div><h4 className="font-extrabold text-slate-950">{item.title}</h4><p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>{item.bullets.length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5">{item.bullets.slice(0, 5).map((bullet) => <li key={bullet} className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-100">{bullet}</li>)}</ul>}</div></div></button>)}</div></div>
        </div>

        {selectedItem?.illustration && <aside className="mt-6 grid overflow-hidden rounded-2xl border border-pink-100 bg-white lg:grid-cols-[minmax(0,1fr)_280px]"><div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-wide text-pink-600">Exemplo técnico</p><h4 className="mt-1 text-lg font-black text-slate-950">{selectedItem.title}</h4><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{selectedItem.description}</p>{selectedItem.bullets.length > 0 && <ul className="mt-4 grid gap-2 sm:grid-cols-2">{selectedItem.bullets.map((bullet) => <li key={bullet} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 text-pink-600" />{bullet}</li>)}</ul>}</div><div className="border-t border-pink-100 bg-pink-50/40 p-4 lg:border-l lg:border-t-0"><TechnicalIllustration kind={selectedItem.illustration} /></div></aside>}

        <footer className="mt-6 flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-pink-600" /><div><p className="font-extrabold text-slate-950">{guide.bottomNoteTitle}</p><p className="mt-1 text-sm leading-6 text-slate-600">{guide.bottomNote}</p></div></div></footer>
      </div>
    </section>
  );
}
