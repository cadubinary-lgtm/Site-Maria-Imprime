export const MARIA_GUIDE_ICON_KEYS = [
  "printer",
  "layers",
  "crop",
  "truck",
  "sparkles",
  "package",
] as const;

export type MariaGuideIconKey = typeof MARIA_GUIDE_ICON_KEYS[number];
export type MariaGuideIllustration = "lona-ilhos" | "lona-bastao" | "lona-sanet" | "adesivo-perfurado" | "papel-gramatura" | "placa" | "laminacao" | "meio-corte" | "vinco-dobra" | "entrega";

export type MariaGuideItem = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  isActive: boolean;
  illustration?: MariaGuideIllustration;
};

export type MariaGuideCategory = {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  items: MariaGuideItem[];
};

export type MariaGuideSection = {
  id: "impressao" | "material" | "acabamento" | "entrega";
  title: string;
  subtitle: string;
  description: string;
  tip: string;
  icon: MariaGuideIconKey;
  isActive: boolean;
  categories: MariaGuideCategory[];
};

export type MariaGuideContent = {
  eyebrow: string;
  title: string;
  description: string;
  bottomNoteTitle: string;
  bottomNote: string;
  sections: MariaGuideSection[];
};

const guideItem = (id: string, title: string, description: string, bullets: string[] = [], illustration?: MariaGuideIllustration): MariaGuideItem => ({ id, title, description, bullets, illustration, isActive: true });
const guideCategory = (id: string, title: string, description: string, items: MariaGuideItem[]): MariaGuideCategory => ({ id, title, description, items, isActive: true });

export const MARIA_GUIDE_FALLBACK: MariaGuideContent = {
  eyebrow: "Guia da Maria",
  title: "Entenda e escolha com mais segurança",
  description: "Conheça os materiais, acabamentos e etapas do pedido de forma simples antes de finalizar sua configuração.",
  bottomNoteTitle: "Importante sobre a sua escolha",
  bottomNote: "O resultado pode variar conforme o material, tipo de impressão, arte enviada e aplicação. Em caso de dúvida, nossa equipe pode orientar você antes da produção.",
  sections: [
    {
      id: "impressao",
      title: "Impressão",
      subtitle: "Conheça os tipos de impressão e suas aplicações.",
      description: "Cada tecnologia atende necessidades diferentes de acabamento, escala e aplicação.",
      tip: "Considere quantidade, material e ambiente de uso. Assim você encontra a solução mais adequada para o projeto.",
      icon: "printer",
      isActive: true,
      categories: [guideCategory("tipos-impressao", "Tipos de impressão", "Escolha a tecnologia mais adequada ao seu projeto.", [
        guideItem("digital", "Impressão Digital", "Indicada para produções personalizadas, pequenas e médias tiragens e trabalhos que precisam de agilidade.", ["Cartões", "Flyers", "Adesivos", "Banners", "Materiais personalizados"]),
        guideItem("offset", "Impressão Offset", "Processo tradicional para grandes tiragens em papel, com excelente uniformidade e consistência de cores.", ["Folhetos", "Folders", "Cartões", "Catálogos", "Grandes tiragens"]),
        guideItem("uv", "Impressão UV", "Cura instantânea da tinta por luz UV para materiais rígidos e flexíveis compatíveis.", ["Placas", "PVC", "Acrílico", "Materiais promocionais"]),
        guideItem("solvente", "Impressão Solvente", "Muito utilizada em comunicação visual e grandes formatos, especialmente para aplicações de boa resistência.", ["Lonas", "Banners", "Faixas", "Fachadas"], "lona-ilhos"),
        guideItem("eco-solvente", "Eco-Solvente", "Tecnologia com excelente qualidade de imagem para diferentes aplicações internas e externas.", ["Adesivos", "Lonas", "Banners", "Vitrines"]),
        guideItem("latex", "Látex", "Impressão à base de tinta aquosa, indicada para comunicação visual e ambientes de baixa emissão de odores.", ["Vitrines", "Banners", "Adesivos", "Comunicação interna"]),
        guideItem("sublimacao", "Sublimação", "Processo para tecidos e materiais preparados, permitindo imagens vibrantes e personalizadas.", ["Bandeiras", "Tecidos", "Displays", "Eventos"]),
      ])],
    },
    {
      id: "material",
      title: "Material",
      subtitle: "Escolha o material ideal para o seu projeto.",
      description: "Compare características, aparência e aplicações antes de decidir.",
      tip: "Considere o ambiente de uso, o tempo de exposição e o impacto visual desejado. Cada material possui características próprias.",
      icon: "layers",
      isActive: true,
      categories: [
        guideCategory("lonas", "Lonas", "Materiais para grandes formatos, comunicação visual interna e externa.", [
          guideItem("lona-280", "Lona 280g", "Opção leve e versátil para projetos de comunicação visual, conforme a estrutura e o acabamento definidos.", ["Banners", "Faixas", "Painéis", "Eventos"], "lona-ilhos"),
          guideItem("lona-340", "Lona 340g", "Equilíbrio entre leveza e resistência para diferentes projetos de comunicação visual.", ["Banners", "Painéis", "Campanhas", "Eventos"], "lona-bastao"),
          guideItem("lona-440", "Lona 440g", "Material com maior corpo para projetos que podem se beneficiar de mais resistência e estabilidade.", ["Fachadas", "Banners grandes", "Painéis", "Grandes formatos"], "lona-ilhos"),
          guideItem("lona-510", "Lona 510g", "Opção de alta resistência para aplicações cuja instalação e especificação pedem uma lona mais robusta.", ["Fachadas", "Painéis", "Estruturas", "Áreas externas"], "lona-ilhos"),
          guideItem("lona-sanet", "Lona Ortofônica / Sanet — Perfurada", "Lona com microfuros que permitem circulação de ar e passagem parcial de luz e som, interessante para grandes áreas e estruturas expostas ao vento.", ["Fachadas", "Grandes painéis", "Eventos", "Cenários", "Stands", "Divisórias", "Veículos"], "lona-sanet"),
          guideItem("lona-backlight", "Lona Backlight", "Material para aplicações com iluminação traseira, de acordo com a estrutura e o projeto luminoso.", ["Caixas luminosas", "Painéis iluminados", "Fachadas luminosas"], "lona-bastao"),
        ]),
        guideCategory("adesivos", "Adesivos", "Soluções para vitrines, paredes, sinalização e comunicação visual.", [
          guideItem("vinil-brilho", "Vinil Branco Brilho", "Superfície brilhante que proporciona maior impacto visual e cores intensas.", ["Fachadas", "Vitrines", "Promoções", "Sinalização"]),
          guideItem("vinil-fosco", "Vinil Branco Fosco", "Menor reflexão de luz e aparência discreta para aplicações internas e decorativas.", ["Vitrines", "Paredes", "Decoração", "Identificação"]),
          guideItem("vinil-transparente", "Vinil Transparente", "Permite que parte da superfície aplicada permaneça visível.", ["Vidros", "Portas", "Janelas", "Logotipos"]),
          guideItem("adesivo-perfurado", "Adesivo Perfurado", "Microperfurações permitem a visão através do material pelo lado apropriado.", ["Vitrines", "Veículos", "Janelas", "Fachadas envidraçadas"], "adesivo-perfurado"),
          guideItem("adesivo-blackout", "Adesivo Blackout", "Camada que reduz a interferência visual do fundo na arte aplicada.", ["Coberturas", "Vitrines", "Paredes", "Troca de comunicação"]),
          guideItem("adesivo-refletivo", "Adesivo Refletivo", "Desenvolvido para refletir luz incidente e aumentar a visibilidade em aplicações específicas.", ["Sinalização", "Identificação", "Comunicação externa"]),
        ]),
        guideCategory("papeis-couche", "Papéis Couchê", "Papéis revestidos para materiais promocionais e impressos de maior presença visual.", [
          guideItem("couche-90", "Couchê 90g", "Opção leve para materiais informativos e promocionais.", ["Informativos", "Folhetos", "Materiais leves"], "papel-gramatura"),
          guideItem("couche-115", "Couchê 115g", "Boa escolha para flyers e materiais promocionais.", ["Folhetos", "Flyers", "Informativos"], "papel-gramatura"),
          guideItem("couche-150", "Couchê 150g", "Gramatura intermediária para peças promocionais.", ["Flyers", "Panfletos", "Folders", "Cartazes"], "papel-gramatura"),
          guideItem("couche-170", "Couchê 170g", "Maior corpo para folders e cartazes.", ["Flyers", "Folders", "Cartazes"], "papel-gramatura"),
          guideItem("couche-210", "Couchê 210g", "Estrutura para capas e folders mais firmes.", ["Folders", "Capas", "Materiais promocionais"], "papel-gramatura"),
          guideItem("couche-250", "Couchê 250g", "Gramatura encorpada para peças de apresentação.", ["Cartões", "Postais", "Convites", "Capas"], "papel-gramatura"),
          guideItem("couche-300", "Couchê 300g", "Opção premium para peças que exigem maior rigidez.", ["Cartões encorpados", "Convites", "Capas"], "papel-gramatura"),
        ]),
        guideCategory("papeis-offset", "Papéis Offset", "Papéis sem revestimento para documentos e papelaria institucional.", [
          guideItem("offset-75", "Offset 75g", "Papel leve para uso interno e impressões simples.", ["Documentos", "Formulários", "Uso interno"], "papel-gramatura"),
          guideItem("offset-90", "Offset 90g", "Boa escolha para papelaria e informativos corporativos.", ["Documentos", "Papelaria", "Informativos"], "papel-gramatura"),
          guideItem("offset-120", "Offset 120g", "Maior presença para papel timbrado e materiais institucionais.", ["Papel timbrado", "Miolos", "Informativos"], "papel-gramatura"),
          guideItem("offset-180", "Offset 180g", "Maior corpo para certificados, capas e cartazes.", ["Certificados", "Capas", "Cartazes"], "papel-gramatura"),
        ]),
        guideCategory("papeis-especiais", "Papéis Especiais", "Materiais para projetos com estética, estrutura ou proposta diferenciada.", [
          guideItem("reciclato", "Reciclato", "Papel de aparência natural para projetos com proposta sustentável.", ["Papelaria", "Cartões", "Tags", "Materiais institucionais"], "papel-gramatura"),
          guideItem("kraft", "Kraft", "Material de aparência natural e rústica.", ["Embalagens", "Tags", "Etiquetas", "Produtos artesanais"], "papel-gramatura"),
          guideItem("supremo", "Supremo", "Papel cartão estruturado para peças com maior corpo.", ["Cartões", "Convites", "Tags", "Capas"], "papel-gramatura"),
          guideItem("duplex", "Duplex", "Papel cartão para aplicações gráficas e embalagens.", ["Caixas", "Embalagens", "Cartuchos", "Materiais promocionais"], "papel-gramatura"),
          guideItem("triplex", "Triplex", "Papel cartão com acabamento adequado para projetos de maior apresentação visual.", ["Embalagens", "Caixas", "Cartuchos", "Materiais premium"], "papel-gramatura"),
        ]),
        guideCategory("placas", "Placas e Comunicação Visual", "Materiais rígidos para sinalização, fachadas e identificação.", [
          guideItem("pvc-expandido", "PVC Expandido", "Material leve, rígido e versátil para comunicação visual.", ["Placas", "Displays", "Sinalização", "Comunicação interna"], "placa"),
          guideItem("ps", "PS — Poliestireno", "Material leve e rígido com boa relação entre custo e aplicação.", ["Placas internas", "Displays", "Sinalização"], "placa"),
          guideItem("acm", "ACM", "Painel composto rígido de aparência profissional para comunicação visual.", ["Fachadas", "Totens", "Placas comerciais", "Identificação empresarial"], "placa"),
          guideItem("acrilico", "Acrílico", "Material sofisticado disponível em diferentes acabamentos e transparências.", ["Recepção", "Logotipos", "Placas", "Comunicação corporativa"], "placa"),
          guideItem("mdf", "MDF", "Material rígido de aparência natural para decoração e aplicações especiais.", ["Placas decorativas", "Displays", "Sinalização interna"], "placa"),
        ]),
        guideCategory("materiais-especiais", "Materiais Especiais", "Estrutura pronta para que o administrador cadastre novas soluções sem depender de código.", [
          guideItem("pvc-cristal", "PVC Cristal", "Material especial disponível conforme a configuração comercial da gráfica.", ["Projetos personalizados"]),
          guideItem("acm-escovado", "ACM Escovado", "Acabamento metálico para aplicações de comunicação visual diferenciada.", ["Placas", "Fachadas", "Identificação"]),
        ]),
      ],
    },
    {
      id: "acabamento",
      title: "Acabamento",
      subtitle: "Veja as opções de acabamento disponíveis.",
      description: "Detalhes que valorizam, protegem e tornam o material mais adequado ao uso pretendido.",
      tip: "O acabamento ideal depende do material, do ambiente e da forma de fixação. Nem todas as opções se aplicam a todos os produtos.",
      icon: "crop",
      isActive: true,
      categories: [guideCategory("acabamentos", "Acabamentos disponíveis", "Opções técnicas e visuais para finalizar o seu material.", [
        guideItem("refile", "Refile", "O corte linear padrão realizado em guilhotinas de alta precisão. Remove as bordas brancas, separa os impressos e deixa o material no tamanho final exato contratado."),
        guideItem("corte-especial", "Corte Especial", "Corte totalmente personalizado por facas físicas moldadas ou laser/Router digital. Permite formatos livres, bordas arredondadas, silhuetas e desenhos orgânicos exclusivos."),
        guideItem("meio-corte", "Meio Corte", "Acabamento exclusivo para adesivos e etiquetas. O corte atravessa somente a camada adesiva superior e preserva o liner, facilitando o destaque dos itens.", [], "meio-corte"),
        guideItem("laminacao-brilho", "Laminação Brilho", "Aplicação de uma camada plástica BOPP reflexiva. Protege o papel contra umidade e rasgos, além de realçar a intensidade, o contraste e a vivacidade das cores.", [], "laminacao"),
        guideItem("laminacao-fosca", "Laminação Fosca", "Película plástica opaca e acetinada que elimina reflexos de luz. Confere um visual sofisticado, elegante e corporativo, indicado para cartões de visita e catálogos premium.", [], "laminacao"),
        guideItem("verniz-localizado", "Verniz Localizado", "Aplicação de brilho em áreas específicas da arte, como logotipos, fotos ou detalhes textuais, criando contraste de textura refinado sobre fundos foscos."),
        guideItem("uv-localizado", "UV Localizado", "Processo de secagem por radiação ultravioleta que cria uma camada de verniz transparente com alto brilho e relevo suave sobre elementos selecionados."),
        guideItem("ilhos", "Ilhós", "Anéis metálicos aplicados nas bordas de lonas, banners e placas. Reforçam os pontos de passagem de cordas, abraçadeiras ou ganchos para a fixação." , [], "lona-ilhos"),
        guideItem("bastao", "Bastão", "Suportes cilíndricos de madeira ou plástico nas extremidades do banner, acompanhados de cordinha para pendurar o material de forma alinhada.", [], "lona-bastao"),
        guideItem("ponteira", "Ponteira", "Acabamentos plásticos encaixados nas pontas dos bastões. Protegem o material, evitam farpas e proporcionam um fechamento estético limpo.", [], "lona-bastao"),
        guideItem("solda", "Solda", "Processo térmico ou eletrônico para unir lonas de grandes formatos ou criar bainhas reforçadas nas extremidades, garantindo resistência a ventos e intempéries."),
        guideItem("dobra", "Dobra", "Dobramento mecânico após o vinco. Pode formar dobra simples, sanfona ou carteira, conforme o projeto gráfico.", [], "vinco-dobra"),
        guideItem("vinco", "Vinco", "Prensa mecânica que cria uma linha-guia sem romper o material. Facilita dobras perfeitas em papéis de alta gramatura e evita trincas na tinta.", [], "vinco-dobra"),
        guideItem("furo", "Furo", "Perfuração cilíndrica em diâmetros padronizados, indicada para tags, crachás, ingressos e folhetos que precisam de cordões ou presilhas."),
        guideItem("enobrecimentos", "Enobrecimentos", "Categoria premium de acabamentos como Soft Touch, relevo seco e aplicações metalizadas, que acrescentam valor tátil e visual ao impresso."),
        guideItem("aplicacao", "Aplicação", "Serviço manual ou automatizado de montagem, como fitas dupla-face em móbiles, adesivos em stoppers ou bolsos internos em pastas corporativas."),
        guideItem("embalagem", "Embalagem", "Contagem, separação em lotes e empacotamento em plástico, caixas ou papel Kraft para que o material seja transportado com segurança."),
        guideItem("numeracao", "Numeração", "Inserção de números sequenciais ou variáveis em cada unidade, essencial para ingressos, comandas, rifas, cupons e talões."),
        guideItem("hot-stamping", "Hot Stamping", "Aplicação de fita metálica aquecida por pressão, em ouro, prata, bronze ou holográfico, criando um efeito espelhado premium em partes selecionadas do impresso."),
        guideItem("serrilha", "Serrilha", "Corte tracejado que mantém o papel unido, mas permite destacar uma parte com facilidade, como canhotos de ingressos, cupons e vales."),
        guideItem("borda-arredondada", "Borda Arredondada", "Corte que remove as quinas vivas de cartões e materiais de fidelidade, criando cantos curvos, suaves e mais resistentes ao desgaste."),
        guideItem("fita-dupla-face", "Fita Dupla Face Aplicada", "Tiras adesivas aplicadas no verso para que cartazes, faixas de gôndola e displays saiam prontos para instalar na parede ou vitrine."),
        guideItem("verniz-brilho-lona", "Verniz Brilho para Lona", "Camada líquida protetora de alto brilho que intensifica cores e contraste, cria barreira contra raios UV, poluição e riscos superficiais em lonas externas."),
        guideItem("verniz-fosco-lona", "Verniz Fosco para Lona", "Cobertura líquida acetinada e sem reflexo, indicada para backdrops, eventos, estúdios e ambientes internos com iluminação intensa."),
        guideItem("laminacao-brilho-lona", "Laminação Brilho para Lona", "Película plástica transparente brilhante aplicada por calandragem. Amplia a resistência mecânica contra rasgos, ventos e intempéries e permite limpeza com produtos neutros."),
        guideItem("laminacao-fosca-lona", "Laminação Fosca para Lona", "Aplicação de película plástica protetora opaca de alta resistência. Une o visual sofisticado e antirreflexo do fosco à blindagem contra o desbotamento causado pelo sol, estendendo a vida útil de lonas expostas ao tempo."),
      ])],
    },
    {
      id: "entrega",
      title: "Entrega e retirada",
      subtitle: "Conheça os prazos, entregas e formas de retirada.",
      description: "Entenda como a produção, o frete e a retirada se organizam para o seu pedido.",
      tip: "Os prazos e valores exibidos durante o configurador refletem as opções disponíveis para as escolhas e o CEP informado.",
      icon: "truck",
      isActive: true,
      categories: [guideCategory("recebimento", "Entrega e retirada", "Etapas para planejar o recebimento do seu pedido.", [
        guideItem("prazo-producao", "Prazo de produção", "O prazo é informado durante a configuração e pode variar conforme as opções, quantidade e características do pedido.", [], "entrega"),
        guideItem("entrega", "Entrega", "Consulte as opções disponíveis para sua região informando o CEP.", [], "entrega"),
        guideItem("calculo-frete", "Cálculo de frete", "O valor do frete depende do endereço, modalidade de entrega e características do pedido.", [], "entrega"),
        guideItem("retirada", "Retirada", "Quando disponível, você poderá escolher a retirada na unidade indicada pela Maria Imprime.", [], "entrega"),
        guideItem("acompanhamento", "Acompanhamento", "O andamento do pedido pode ser acompanhado pela sua conta no site.", ["Pedido recebido", "Pagamento aprovado", "Arte em análise", "Em produção", "Pronto", "Entregue"], "entrega"),
      ])],
    },
  ],
};

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function mergeMariaGuideContent(value?: unknown): MariaGuideContent {
  if (!value || typeof value !== "object") return MARIA_GUIDE_FALLBACK;
  const raw = value as Partial<MariaGuideContent>;
  const sectionsById = new Map(Array.isArray(raw.sections) ? raw.sections.map((section) => [section?.id, section]) : []);
  return {
    eyebrow: asString(raw.eyebrow, MARIA_GUIDE_FALLBACK.eyebrow),
    title: asString(raw.title, MARIA_GUIDE_FALLBACK.title),
    description: asString(raw.description, MARIA_GUIDE_FALLBACK.description),
    bottomNoteTitle: asString(raw.bottomNoteTitle, MARIA_GUIDE_FALLBACK.bottomNoteTitle),
    bottomNote: asString(raw.bottomNote, MARIA_GUIDE_FALLBACK.bottomNote),
    sections: MARIA_GUIDE_FALLBACK.sections.map((fallbackSection) => {
      const saved = sectionsById.get(fallbackSection.id) as Partial<MariaGuideSection> | undefined;
      return saved && Array.isArray(saved.categories) ? {
        ...fallbackSection,
        ...saved,
        title: asString(saved.title, fallbackSection.title),
        subtitle: asString(saved.subtitle, fallbackSection.subtitle),
        description: asString(saved.description, fallbackSection.description),
        tip: asString(saved.tip, fallbackSection.tip),
        categories: saved.categories,
      } : fallbackSection;
    }),
  };
}

export function parseMariaGuideContent(value?: string | null) {
  if (!value) return MARIA_GUIDE_FALLBACK;
  try {
    return mergeMariaGuideContent(JSON.parse(value));
  } catch {
    return MARIA_GUIDE_FALLBACK;
  }
}
