import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("carrossel administrável da página inicial", () => {
  const schema = read("drizzle/schema.ts");
  const router = read("server/homeCarouselRouter.ts");
  const adminPage = read("client/src/pages/admin/AdminHomeCarousel.tsx");
  const publicCarousel = read("client/src/components/home/HomeSegmentsCarousel.tsx");
  const home = read("client/src/pages/public/Home.tsx");
  const app = read("client/src/App.tsx");
  const navigation = read("client/src/components/AdminLayout.tsx");
  const framingMigration = read("drizzle/0066_add_home_carousel_image_framing.sql");

  it("persiste imagem, posição e segmento de destino", () => {
    expect(schema).toContain('export const homeCarouselSlides = mysqlTable("homeCarouselSlides"');
    expect(schema).toContain('imageUrl: text("imageUrl").notNull()');
    expect(schema).toContain('segmentId: int("segmentId").notNull()');
    expect(schema).toContain('position: int("position").notNull().default(0)');
    expect(router).toContain("const MAX_SLIDES = 6");
    expect(router).toContain("O carrossel aceita no máximo ${MAX_SLIDES} imagens");
    expect(router).toContain("requireSegment(input.segmentId)");
  });

  it("protege a edição e oferece listagem pública somente de slides ativos", () => {
    expect(router).toContain("listPublic: publicProcedure");
    expect(router).toContain(".where(eq(homeCarouselSlides.isActive, true))");
    expect(router).toContain("listAdmin: adminAnyProcedure");
    expect(router).toContain("create: adminAnyProcedure");
    expect(router).toContain("update: adminAnyProcedure");
    expect(router).toContain("remove: adminAnyProcedure");
    expect(router).toContain("reorder: adminAnyProcedure");
  });

  it("persiste e aplica a escala e a posição escolhidas para enquadrar cada imagem", () => {
    expect(schema).toContain('imageScale: decimal("imageScale", { precision: 4, scale: 2 }).notNull().default("1.00")');
    expect(schema).toContain('imagePositionX: int("imagePositionX").notNull().default(50)');
    expect(schema).toContain('imagePositionY: int("imagePositionY").notNull().default(50)');
    expect(framingMigration).toContain("ADD COLUMN `imageScale` decimal(4,2) NOT NULL DEFAULT 1.00");
    expect(router).toContain("imageScale: z.number().min(1).max(2).default(1)");
    expect(router).toContain("imagePositionX: z.number().int().min(0).max(100).default(50)");
    expect(router).toContain("imageScale: input.imageScale.toFixed(2)");
    expect(adminPage).toContain("Tamanho recomendado: {RECOMMENDED_IMAGE_SIZE}");
    expect(adminPage).toContain("Enquadramento da imagem");
    expect(adminPage).toContain('id="carousel-image-scale"');
    expect(adminPage).toContain("Redefinir");
    expect(publicCarousel).toContain("transform: `scale(${Number(slide.imageScale)})`");
    expect(publicCarousel).toContain("objectPosition: `${slide.imagePositionX}% ${slide.imagePositionY}%`");
  });

  it("inclui Produtos → Carrossel e a rota protegida nos dois ambientes", () => {
    expect(navigation).toContain('{ label: "Carrossel", href: "/admin/produtos/carrossel" }');
    expect(app).toContain('import AdminHomeCarousel from "./pages/admin/AdminHomeCarousel"');
    expect(app.match(/path="\/admin\/produtos\/carrossel" component=\{AdminHomeCarousel\}/g)).toHaveLength(2);
    expect(adminPage).toContain("Imagens configuradas");
    expect(adminPage).toContain("Adicionar imagem");
    expect(adminPage).toContain("Ver opções");
    expect(adminPage).toContain("const MAX_SLIDES = 6");
  });

  it("insere um carrossel acessível, automático e pausável entre produtos e como funciona", () => {
    expect(publicCarousel).toContain("AUTOPLAY_INTERVAL_MS = 5000");
    expect(publicCarousel).toContain("prefers-reduced-motion: reduce");
    expect(publicCarousel).toContain("const [previousIndex, setPreviousIndex] = useState<number | null>(null)");
    expect(publicCarousel).toContain("return (current + 1) % totalSlides");
    expect(publicCarousel).toContain("transition-transform");
    expect(publicCarousel).toContain("duration-700");
    expect(publicCarousel).toContain("ease-[cubic-bezier(0.22,1,0.36,1)]");
    expect(publicCarousel).toContain('"translate-x-full"');
    expect(publicCarousel).toContain('"-translate-x-full"');
    expect(publicCarousel).toContain("invisible ${incomingPosition} pointer-events-none");
    expect(publicCarousel).toContain("motion-reduce:transition-none");
    expect(publicCarousel).toContain("onMouseEnter={() => setIsPaused(true)}");
    expect(publicCarousel).toContain("onFocusCapture={() => setIsPaused(true)}");
    expect(publicCarousel).not.toContain("A reprodução pausa ao passar o mouse ou navegar pelo carrossel.");
    expect(publicCarousel).toContain('aria-roledescription="carrossel"');
    expect(publicCarousel).toContain("navigate(`/catalogo?segmentId=${slide.segmentId}`)");
    expect(publicCarousel).toContain(">Ver opções</button>");
    expect(publicCarousel).toContain("items-end p-3 sm:items-start sm:p-8");
    expect(publicCarousel).toContain("px-1.5 py-1 text-[9px]");
    expect(publicCarousel).toContain("sm:px-5 sm:py-2.5 sm:text-sm");
    expect(publicCarousel).toContain("h-6 w-6");
    expect(publicCarousel).toContain("sm:h-10 sm:w-10");
    expect(publicCarousel).toContain("h-3 w-3 sm:h-5 sm:w-5");
    expect(publicCarousel).not.toContain(">{slide.segmentName}</p>");
    expect(home).toContain("<FeaturedProducts />");
    expect(home).toContain("<HomeSegmentsCarousel />");
    expect(home).toContain("<HowItWorks />");
    expect(home).not.toContain("WhyChooseUs");
    expect(home.indexOf("<FeaturedProducts />")).toBeLessThan(home.indexOf("<HomeSegmentsCarousel />"));
    expect(home.indexOf("<HomeSegmentsCarousel />")).toBeLessThan(home.indexOf("<HowItWorks />"));
  });
});
