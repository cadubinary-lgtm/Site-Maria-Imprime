export type ReceiptPdfData = {
  receiptNumber: string;
  orderNumber?: string | null;
  customerName: string;
  customerEmail?: string | null;
  amount: string | number;
  paymentMethod: string;
  paidAt: number | Date;
  companyName: string;
  legalName?: string | null;
  cnpj: string;
  commercialPhone?: string | null;
  supportEmail?: string | null;
  items: Array<{ id: number; productName?: string | null; quantity: number; priceAtOrder: string | number }>;
};

const formatCurrency = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

export async function exportReceiptPDF(data: ReceiptPdfData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;
  const pink: [number, number, number] = [236, 72, 153];
  const slate: [number, number, number] = [30, 41, 59];
  const muted: [number, number, number] = [100, 116, 139];

  doc.setFillColor(...pink);
  doc.roundedRect(margin, y, contentWidth, 2, 1, 1, "F");
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...slate);
  doc.setFontSize(20);
  doc.text(data.companyName || "Maria Imprime", margin, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.text(`CNPJ: ${data.cnpj}`, margin, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...pink);
  doc.setFontSize(14);
  doc.text("RECIBO", pageWidth - margin, y - 2, { align: "right" });
  doc.setTextColor(...slate);
  doc.setFontSize(12);
  doc.text(data.receiptNumber, pageWidth - margin, y + 5, { align: "right" });
  y += 20;

  doc.setFillColor(253, 242, 248);
  doc.roundedRect(margin, y, contentWidth, 42, 3, 3, "F");
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slate);
  doc.setFontSize(11);
  const statement = data.orderNumber
    ? `Recebemos de ${data.customerName} a quantia de ${formatCurrency(data.amount)}, referente ao pagamento do pedido #${data.orderNumber}.`
    : `Recebemos de ${data.customerName} a quantia de ${formatCurrency(data.amount)}, referente aos itens discriminados neste recibo.`;
  doc.text(doc.splitTextToSize(statement, contentWidth - 12), margin + 6, y + 10);
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(`Forma de pagamento: ${data.paymentMethod}`, margin + 6, y + 28);
  doc.text(`Data do recebimento: ${new Date(data.paidAt).toLocaleString("pt-BR")}`, margin + 6, y + 35);
  y += 53;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...slate);
  doc.setFontSize(11);
  doc.text(data.orderNumber ? "ITENS DO PEDIDO" : "ITENS DO RECIBO", margin, y);
  y += 7;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(8);
  doc.text("PRODUTO / SERVIÇO", margin + 4, y + 5.5);
  doc.text("QTD.", pageWidth - margin - 45, y + 5.5, { align: "center" });
  doc.text("VALOR", pageWidth - margin - 4, y + 5.5, { align: "right" });
  y += 13;
  doc.setFont("helvetica", "normal");
  data.items.forEach((item) => {
    const product = item.productName || "Produto personalizado";
    const productLines = doc.splitTextToSize(product, contentWidth - 75);
    const rowHeight = Math.max(9, productLines.length * 4.5 + 4);
    doc.setTextColor(...slate);
    doc.text(productLines, margin + 4, y + 4);
    doc.text(String(item.quantity), pageWidth - margin - 45, y + 4, { align: "center" });
    doc.text(formatCurrency(Number(item.priceAtOrder) * item.quantity), pageWidth - margin - 4, y + 4, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    y += rowHeight + 2;
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...pink);
  doc.text(`TOTAL RECEBIDO: ${formatCurrency(data.amount)}`, pageWidth - margin, y + 8, { align: "right" });
  y += 23;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 37, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...slate);
  doc.text("OBSERVAÇÕES DA EMPRESA", margin + 6, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  const notes = [
    "Este recibo comprova o recebimento do valor informado.",
    "Este documento não substitui a nota fiscal quando sua emissão for aplicável.",
    `Em caso de divergência, entre em contato com ${data.commercialPhone || data.supportEmail || "o atendimento da empresa"}.`,
  ];
  notes.forEach((note, index) => doc.text(`• ${note}`, margin + 6, y + 15 + index * 7));
  y += 54;

  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth / 2 - 35, y, pageWidth / 2 + 35, y);
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text("Assinatura do responsável", pageWidth / 2, y + 5, { align: "center" });
  doc.text(data.legalName || data.companyName, pageWidth / 2, y + 15, { align: "center" });
  doc.save(`recibo-${data.receiptNumber.replace(/[^a-z0-9-]/gi, "-")}.pdf`);
}
