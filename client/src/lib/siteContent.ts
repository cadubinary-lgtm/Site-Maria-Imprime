import { PUBLIC_DOCUMENTS } from "@/components/TermsAcceptance";

export const FOOTER_CONTENT_FALLBACK = {
  introduction: "A Maria Imprime transforma suas ideias em comunicação visual com atenção aos detalhes, praticidade e qualidade em cada pedido.",
  newsletterTitle: "Fique por dentro!",
  newsletterDescription: "Receba novidades, promoções e dicas exclusivas da Maria Imprime.",
  businessHours: "Seg–Sex: 09:00 – 12:00 e 13:30 – 17:00\nSábado e domingo: fechado",
  documentsTitle: "Central de documentação",
  documentsDescription: "Consulte em páginas próprias os documentos, políticas e orientações da Maria Imprime.",
};

export function mergeFooterContent(overrides?: Partial<Record<keyof typeof FOOTER_CONTENT_FALLBACK, string | null>> | null) {
  return {
    introduction: overrides?.introduction ?? FOOTER_CONTENT_FALLBACK.introduction,
    newsletterTitle: overrides?.newsletterTitle ?? FOOTER_CONTENT_FALLBACK.newsletterTitle,
    newsletterDescription: overrides?.newsletterDescription ?? FOOTER_CONTENT_FALLBACK.newsletterDescription,
    businessHours: overrides?.businessHours ?? FOOTER_CONTENT_FALLBACK.businessHours,
    documentsTitle: overrides?.documentsTitle ?? FOOTER_CONTENT_FALLBACK.documentsTitle,
    documentsDescription: overrides?.documentsDescription ?? FOOTER_CONTENT_FALLBACK.documentsDescription,
  };
}

export const DOCUMENT_SUMMARIES: Record<string, string> = {
  "termos-venda": "Regras aplicáveis às compras e aos serviços da Maria Imprime.",
  "aprovacao-arte": "Orientações para conferir e aprovar a arte antes da produção.",
  "producao-prazos": "Informações sobre produção, prazos e condições necessárias.",
  "trocas-reembolsos": "Condições de troca, cancelamento e reembolso.",
  "privacidade-lgpd": "Como tratamos e protegemos seus dados pessoais.",
  "cookies": "Informações sobre o uso de cookies no site.",
  "uso-site": "Regras de uso dos canais digitais da Maria Imprime.",
  "faq": "Respostas para as dúvidas mais frequentes sobre pedidos e impressão.",
  "formas-pagamento": "Modalidades habilitadas, análise e condições de pagamento.",
  "entrega-retirada": "Modalidades de recebimento, estimativas de frete e retirada.",
  "normas-envio-arte": "Orientações técnicas para preparar e enviar arquivos para impressão.",
};

export const ARTWORK_GUIDELINES_CONTENT = `## Como preparar sua arte para impressão

Queremos que seu material fique o mais próximo possível do que você imaginou. Antes de enviar seu arquivo, confira estas orientações. Elas ajudam a evitar cortes indesejados, imagens borradas, alterações de cores e outros problemas que podem comprometer o resultado final da impressão.

### 1. Tamanho correto da arte

Crie sua arte nas mesmas medidas do produto que você selecionou.

**Exemplo:** se você comprou uma lona de **2,00 m x 1,50 m**, sua arte deve ser preparada nessas mesmas medidas.

Evite ampliar uma imagem pequena para um tamanho grande, pois isso pode causar perda de qualidade e definição.

### 2. Margem de segurança

Não coloque textos, telefones, logotipos ou outras informações importantes muito próximos das bordas. Durante o corte e o acabamento podem ocorrer pequenas variações naturais. Por isso, mantenha os elementos importantes afastados das extremidades da arte.

### 3. Utilize imagens de boa qualidade

Uma imagem que parece boa na tela do celular nem sempre terá a mesma qualidade quando impressa.

* Utilize imagens em alta qualidade.
* Evite capturas de tela, imagens retiradas de redes sociais e arquivos comprimidos por aplicativos de mensagens.
* Utilize o arquivo original da imagem.
* Evite imagens que já apresentem pixels, serrilhamento ou falta de nitidez.

**Atenção:** aumentar uma imagem de baixa resolução para 300 DPI não melhora automaticamente sua qualidade. A impressão reproduzirá os detalhes disponíveis no arquivo original, incluindo eventuais pixels, distorções ou falta de definição.

### 4. Prepare corretamente as cores

Para maior fidelidade entre a arte e o resultado impresso, recomendamos preparar o arquivo utilizando o padrão de cores **CMYK**, quando aplicável ao produto e ao processo de impressão.

O CMYK trabalha com quatro cores principais: **Ciano, Magenta, Amarelo e Preto**. Arquivos preparados em **RGB**, padrão utilizado em celulares, computadores e televisores, podem apresentar alterações de tonalidade quando convertidos para impressão.

**Importante:** mesmo utilizando CMYK, a cor visualizada na tela pode apresentar diferenças em relação à impressão final. Isso pode ocorrer devido às características do monitor, do material utilizado e do processo de impressão. Se uma cor específica precisar de alta fidelidade, recomendamos uma avaliação profissional antes da produção.

### 5. Efeitos e elementos da arte

Alguns efeitos utilizados em programas de edição e criação podem não ser reproduzidos exatamente da mesma forma durante a impressão.

* Sombras, transparências, brilhos e desfoques.
* Gradientes, filtros, texturas e outros efeitos especiais.

Quando necessário, esses efeitos podem precisar ser convertidos ou rasterizados antes do envio. Para elementos rasterizados, **300 DPI na resolução final** é uma referência adequada para muitos materiais, desde que seja compatível com o produto e com o tamanho da impressão.

**Importante:** transformar uma imagem de baixa qualidade em 300 DPI não recupera detalhes que não existem no arquivo original.

### 6. Resolução das imagens

A qualidade da impressão depende diretamente da resolução e da qualidade original do arquivo enviado. Para materiais visualizados de perto, **300 DPI no tamanho final de impressão** é uma referência comum. Porém, a resolução ideal pode variar de acordo com o produto, o tamanho da peça e a distância de visualização.

Em materiais grandes, como banners, lonas e fachadas, uma resolução menor pode ser adequada dependendo da aplicação.

### 7. Textos e fontes

Antes de enviar o arquivo final, confira cuidadosamente todos os textos. Sempre que possível, recomendamos converter os textos em **curvas/contornos** ou garantir que as fontes utilizadas estejam corretamente incorporadas ao arquivo. Isso ajuda a evitar alterações de fonte, espaçamento ou formatação durante a abertura do arquivo.

### 8. Confira o acabamento escolhido

Alguns produtos possuem acabamentos que utilizam áreas específicas do material.

* Ilhós, bastão, cordinha e dobras.
* Corte especial, laminação e outros acabamentos.

Confira se sua arte está preparada de acordo com o acabamento selecionado.

### 9. Envie o arquivo no formato indicado

Cada produto pode possuir formatos de arquivo recomendados para impressão. Antes de enviar, confira os formatos aceitos para o produto escolhido e, sempre que possível, envie o arquivo finalizado. Evite enviar arquivos de edição quando eles não forem necessários.

### 10. Artes criadas por Inteligência Artificial

Imagens criadas por Inteligência Artificial podem apresentar excelente aparência na tela, mas isso não significa que estejam tecnicamente preparadas para impressão.

* Resolução insuficiente para o tamanho final e perda de detalhes.
* Textos, logotipos, rostos, mãos ou objetos com deformações.
* Pequenos defeitos que podem ficar mais visíveis após a ampliação.

Por isso, recomendamos verificar cuidadosamente a resolução e a qualidade da imagem antes do envio. Em alguns casos, a arte poderá precisar de **tratamento, correção, vetorização ou ampliação profissional** para alcançar um resultado adequado à impressão.

## Checklist antes de enviar sua arte

* [ ] Arte no tamanho correto.
* [ ] Imagens com boa qualidade.
* [ ] Textos, telefones, contatos e logotipo revisados.
* [ ] Informações importantes afastadas das bordas.
* [ ] Cores, acabamento, produto, quantidade e formato do arquivo conferidos.

## Importante

Nossa equipe realiza uma **conferência técnica do arquivo antes do início da produção**. Essa conferência tem como objetivo identificar aspectos técnicos que possam comprometer a impressão ou a produção do material, mas **não substitui a revisão do conteúdo da arte pelo cliente**.

O cliente é responsável por conferir cuidadosamente textos, números, telefones, endereços, logotipos, imagens, medidas, cores e demais informações presentes no arquivo enviado. A qualidade final da impressão depende diretamente da **qualidade e resolução original do arquivo enviado pelo cliente**.

Arquivos enviados em baixa resolução podem apresentar pixelização, perda de nitidez, serrilhamento, distorções ou outros problemas visuais após a impressão. A **Maria Imprime** não se responsabiliza por problemas de qualidade, definição, pixelização, distorções ou outros defeitos que já estejam presentes no arquivo original enviado pelo cliente.

Ao enviar sua arte, certifique-se de que o arquivo está finalizado e que todas as informações foram revisadas.

**Maria Imprime — Seu material começa com uma arte bem preparada e termina com uma impressão de qualidade.**`;

type DocumentOverride = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  position: number;
  isPublished: boolean;
};

export type ManagedPublicDocument = DocumentOverride;

export function getDefaultPublicDocuments(): ManagedPublicDocument[] {
  const defaults = PUBLIC_DOCUMENTS.map((document, index) => ({
    slug: document.id,
    title: document.title,
    summary: DOCUMENT_SUMMARIES[document.id] || "Documento institucional da Maria Imprime.",
    content: document.content,
    position: index,
    isPublished: true,
  }));

  return [...defaults, {
    slug: "normas-envio-arte",
    title: "Normas para envio de arte",
    summary: DOCUMENT_SUMMARIES["normas-envio-arte"],
    content: ARTWORK_GUIDELINES_CONTENT,
    position: defaults.length,
    isPublished: true,
  }];
}

export function mergeManagedDocuments(overrides?: DocumentOverride[] | null): ManagedPublicDocument[] {
  const saved = new Map((overrides ?? []).map((document) => [document.slug, document]));
  const defaults = getDefaultPublicDocuments().map((document) => saved.get(document.slug) ?? document);
  const additional = (overrides ?? []).filter((document) => !defaults.some((defaultDocument) => defaultDocument.slug === document.slug));
  return [...defaults, ...additional].sort((a, b) => a.position - b.position || a.title.localeCompare(b.title, "pt-BR"));
}

export function mergePublicDocuments(overrides?: DocumentOverride[] | null): ManagedPublicDocument[] {
  return mergeManagedDocuments(overrides).filter((document) => document.isPublished);
}
