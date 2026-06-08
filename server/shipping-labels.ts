import { getDb } from './db';
import { orders, storeSettings } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface ShippingLabelData {
  // Remetente
  senderName: string;
  senderStreet: string;
  senderNumber: string;
  senderComplement: string;
  senderNeighborhood: string;
  senderCity: string;
  senderState: string;
  senderCEP: string;
  senderPhone: string;

  // Destinatário
  recipientName: string;
  recipientStreet: string;
  recipientNumber: string;
  recipientComplement: string;
  recipientNeighborhood: string;
  recipientCity: string;
  recipientState: string;
  recipientCEP: string;
  recipientPhone: string;

  // Envio
  trackingNumber: string;
  weight: number;
  value: number;
  serviceType: string;
  orderId: string;
}

/**
 * Gera dados de etiqueta combinando informações do remetente (storeSettings)
 * com dados do pedido e endereço do cliente
 */
export async function generateShippingLabelData(orderId: number): Promise<ShippingLabelData> {
  const db = await getDb();
  if (!db) throw new Error('Banco de dados indisponível');

  // Buscar pedido
  const orderResult = await db.select().from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const order = orderResult[0];

  if (!order) {
    throw new Error('Pedido não encontrado');
  }

  // Buscar configurações da loja (remetente)
  const settingsResult = await db.select().from(storeSettings)
    .where(eq(storeSettings.id, 1))
    .limit(1);
  const settings = settingsResult[0];

  if (!settings) {
    throw new Error('Configurações de remetente não encontradas. Configure em Logística > Configurações');
  }

  // Extrair CEP do remetente (remover hífen)
  const senderCEP = settings.originCEP?.replace('-', '') || '';

  // Extrair CEP do endereço de entrega
  const recipientCEP = order.deliveryZipCode?.replace('-', '') || '';

  // Calcular peso total do pedido (será implementado depois com itens)
  const weight = 1000; // 1kg padrão (TODO: calcular com itens do pedido)

  // Gerar número de rastreamento (formato simplificado)
  const trackingNumber = `BR${order.id.toString().padStart(8, '0')}`;

  return {
    // Remetente
    senderName: 'Gráfica Ponto Digital', // TODO: Buscar do settings
    senderStreet: settings.senderStreet || '',
    senderNumber: settings.senderNumber || '',
    senderComplement: settings.senderComplement || '',
    senderNeighborhood: settings.senderNeighborhood || '',
    senderCity: settings.senderCity || '',
    senderState: settings.senderState || '',
    senderCEP: senderCEP,
    senderPhone: '(21) 0000-0000', // TODO: Buscar do settings

    // Destinatário
    recipientName: order.deliveryFullName || order.guestName || 'Cliente',
    recipientStreet: order.deliveryStreet || '',
    recipientNumber: order.deliveryNumber || '',
    recipientComplement: order.deliveryComplement || '',
    recipientNeighborhood: order.deliveryNeighborhood || '',
    recipientCity: order.deliveryCity || '',
    recipientState: order.deliveryState || '',
    recipientCEP: recipientCEP,
    recipientPhone: order.deliveryPhone || '',

    // Envio
    trackingNumber: trackingNumber,
    weight: weight,
    value: Number(order.totalPrice) || 0,
    serviceType: order.shippingMethod || 'SEDEX',
    orderId: order.id.toString(),
  };
}

/**
 * Gera HTML da etiqueta em formato A4 (Correios padrão)
 * Formato: 10cm x 15cm (100mm x 150mm)
 */
export function generateShippingLabelHTML(data: ShippingLabelData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Etiqueta de Envio - Pedido ${data.orderId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', monospace;
      background: white;
      padding: 10mm;
    }

    .label-container {
      width: 100mm;
      height: 150mm;
      border: 2px solid #000;
      padding: 8mm;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: white;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 4mm;
      margin-bottom: 4mm;
    }

    .header h1 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 2mm;
    }

    .tracking-number {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
      margin: 4mm 0;
      font-family: 'Courier New', monospace;
    }

    .barcode {
      font-size: 12px;
      letter-spacing: 1px;
      font-family: 'Courier New', monospace;
      margin-bottom: 2mm;
    }

    .section {
      margin-bottom: 4mm;
      font-size: 11px;
      line-height: 1.4;
    }

    .section-title {
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
      margin-bottom: 2mm;
      border-bottom: 1px solid #000;
      padding-bottom: 1mm;
    }

    .address-block {
      border: 1px solid #000;
      padding: 3mm;
      margin-bottom: 2mm;
    }

    .address-line {
      font-size: 11px;
      line-height: 1.3;
      margin-bottom: 1mm;
    }

    .address-line:last-child {
      margin-bottom: 0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 1mm;
    }

    .info-label {
      font-weight: bold;
      min-width: 30mm;
    }

    .info-value {
      flex: 1;
    }

    .footer {
      border-top: 2px solid #000;
      padding-top: 2mm;
      text-align: center;
      font-size: 9px;
    }

    @media print {
      body {
        padding: 0;
      }
      .label-container {
        page-break-after: always;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="label-container">
    <!-- Header -->
    <div class="header">
      <h1>ETIQUETA DE ENVIO</h1>
      <div class="tracking-number">${data.trackingNumber}</div>
      <div class="barcode">|${data.trackingNumber}|</div>
    </div>

    <!-- Remetente -->
    <div class="section">
      <div class="section-title">Remetente</div>
      <div class="address-block">
        <div class="address-line"><strong>${data.senderName}</strong></div>
        <div class="address-line">${data.senderStreet}, ${data.senderNumber}</div>
        ${data.senderComplement ? `<div class="address-line">${data.senderComplement}</div>` : ''}
        <div class="address-line">${data.senderNeighborhood} - ${data.senderCity}/${data.senderState}</div>
        <div class="address-line">CEP: ${data.senderCEP.slice(0, 5)}-${data.senderCEP.slice(5)}</div>
        <div class="address-line">Tel: ${data.senderPhone}</div>
      </div>
    </div>

    <!-- Destinatário -->
    <div class="section">
      <div class="section-title">Destinatário</div>
      <div class="address-block">
        <div class="address-line"><strong>${data.recipientName}</strong></div>
        <div class="address-line">${data.recipientStreet}, ${data.recipientNumber}</div>
        ${data.recipientComplement ? `<div class="address-line">${data.recipientComplement}</div>` : ''}
        <div class="address-line">${data.recipientNeighborhood} - ${data.recipientCity}/${data.recipientState}</div>
        <div class="address-line">CEP: ${data.recipientCEP.slice(0, 5)}-${data.recipientCEP.slice(5)}</div>
        <div class="address-line">Tel: ${data.recipientPhone}</div>
      </div>
    </div>

    <!-- Informações de Envio -->
    <div class="section">
      <div class="info-row">
        <span class="info-label">Serviço:</span>
        <span class="info-value">${data.serviceType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Peso:</span>
        <span class="info-value">${(data.weight / 1000).toFixed(2)} kg</span>
      </div>
      <div class="info-row">
        <span class="info-label">Valor:</span>
        <span class="info-value">R$ ${data.value.toFixed(2)}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Pedido #${data.orderId} | ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Gera PDF da etiqueta (usa wkhtmltopdf ou similar)
 * Por enquanto, retorna HTML que pode ser impresso
 */
export async function generateShippingLabelPDF(orderId: number): Promise<string> {
  const labelData = await generateShippingLabelData(orderId);
  return generateShippingLabelHTML(labelData);
}
