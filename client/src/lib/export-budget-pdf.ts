/**
 * Utilitário para exportar orçamento em PDF
 * Usa a biblioteca jsPDF para gerar PDFs no cliente
 */

interface BudgetData {
  productName: string;
  productDescription?: string;
  basePrice: number;
  selectedAttributes: Array<{
    name: string;
    value: string;
    priceModifier?: number;
  }>;
  quantity: number;
  finalPrice: number;
  deadline?: string;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  companyName?: string;
  companyLogo?: string;
}

export async function exportBudgetPDF(data: BudgetData): Promise<void> {
  // Importar jsPDF dinamicamente para evitar bundle desnecessário
  const { jsPDF } = await import("jspdf");
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Cores
  const primaryColor = [255, 102, 0]; // Laranja
  const textColor = [51, 51, 51]; // Cinza escuro
  const lightGray = [242, 242, 242]; // Cinza claro

  // Cabeçalho com logo/nome da empresa
  if (data.companyLogo) {
    try {
      doc.addImage(data.companyLogo, "PNG", margin, yPosition, 30, 30);
    } catch (e) {
      console.warn("Erro ao adicionar logo:", e);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(data.companyName || "Maria Imprime", margin + 35, yPosition + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text("ORÇAMENTO", margin + 35, yPosition + 20);

  yPosition += 40;

  // Informações do cliente
  if (data.customerName || data.customerEmail) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CLIENTE", margin, yPosition);

    yPosition += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (data.customerName) {
      doc.text(`Nome: ${data.customerName}`, margin, yPosition);
      yPosition += 6;
    }
    if (data.customerEmail) {
      doc.text(`Email: ${data.customerEmail}`, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 5;
  }

  // Seção de Produto
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PRODUTO", margin, yPosition);

  yPosition += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Produto: ${data.productName}`, margin, yPosition);
  yPosition += 6;

  if (data.productDescription) {
    doc.setFontSize(9);
    const descLines = doc.splitTextToSize(data.productDescription, contentWidth - 10);
    doc.text(descLines, margin, yPosition);
    yPosition += descLines.length * 4 + 2;
  }

  yPosition += 3;

  // Tabela de Atributos
  if (data.selectedAttributes.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ATRIBUTOS SELECIONADOS", margin, yPosition);

    yPosition += 7;

    // Cabeçalho da tabela
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(margin, yPosition - 4, contentWidth, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);
    doc.text("Atributo", margin + 2, yPosition);
    doc.text("Valor", margin + contentWidth - 40, yPosition);
    doc.text("Modificador", margin + contentWidth - 15, yPosition);

    yPosition += 8;

    // Linhas da tabela
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    data.selectedAttributes.forEach((attr) => {
      doc.text(attr.name, margin + 2, yPosition);
      doc.text(attr.value, margin + contentWidth - 40, yPosition);

      if (attr.priceModifier) {
        const modifier = attr.priceModifier > 0 ? `+R$ ${attr.priceModifier.toFixed(2)}` : `R$ ${attr.priceModifier.toFixed(2)}`;
        doc.text(modifier, margin + contentWidth - 15, yPosition);
      }

      yPosition += 6;
    });

    yPosition += 5;
  }

  // Seção de Preços
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(margin, yPosition - 4, contentWidth, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("VALORES", margin + 2, yPosition);

  yPosition += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Preço base
  doc.text("Preço Base:", margin, yPosition);
  doc.text(`R$ ${data.basePrice.toFixed(2)}`, margin + contentWidth - 30, yPosition, { align: "right" });
  yPosition += 6;

  // Quantidade
  doc.text("Quantidade:", margin, yPosition);
  doc.text(data.quantity.toString(), margin + contentWidth - 30, yPosition, { align: "right" });
  yPosition += 6;

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("TOTAL:", margin, yPosition);
  doc.text(`R$ ${data.finalPrice.toFixed(2)}`, margin + contentWidth - 30, yPosition, { align: "right" });

  yPosition += 12;

  // Prazo
  if (data.deadline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Prazo de Entrega: ${data.deadline}`, margin, yPosition);
    yPosition += 8;
  }

  // Observações
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OBSERVAÇÕES:", margin, yPosition);

    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(data.notes, contentWidth - 10);
    doc.text(noteLines, margin, yPosition);

    yPosition += noteLines.length * 4;
  }

  // Rodapé
  yPosition = pageHeight - 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150) as any;
  doc.text("Este orçamento é válido por 30 dias.", margin, yPosition);
  doc.text("Para confirmar o pedido, entre em contato conosco.", margin, yPosition + 4);

  // Número da página
  doc.text(`Página 1 de 1`, pageWidth / 2, yPosition + 8, { align: "center" });

  // Salvar PDF
  const fileName = `orcamento-${data.productName.replace(/\s+/g, "-")}-${new Date().getTime()}.pdf`;
  doc.save(fileName);
}

/**
 * Exportar orçamento com validações
 */
export async function exportBudgetPDFWithValidation(data: BudgetData): Promise<boolean> {
  try {
    if (!data.productName) {
      throw new Error("Nome do produto é obrigatório");
    }

    if (data.finalPrice <= 0) {
      throw new Error("Preço final deve ser maior que zero");
    }

    if (data.quantity <= 0) {
      throw new Error("Quantidade deve ser maior que zero");
    }

    await exportBudgetPDF(data);
    return true;
  } catch (error) {
    console.error("Erro ao exportar orçamento:", error);
    throw error;
  }
}
