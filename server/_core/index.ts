import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import multer from "multer";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut, storageGetSignedUrl } from "../storage";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // Upload endpoint
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });
  
  // Helper: sanitiza nome de arquivo para evitar 403 do S3/CloudFront
  function sanitizeFilename(name: string): string {
    return name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remover acentos
      .replace(/[^a-zA-Z0-9._-]/g, '_') // substituir espaços e caracteres especiais
      .replace(/_+/g, '_') // colapsar múltiplos _ em um
      .replace(/^_|_$/g, '') // remover _ no início/fim
      || 'arquivo';
  }

  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
      }

      const { originalname, buffer, mimetype } = req.file;
      
      // Validar formato de imagem
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(mimetype)) {
        return res.status(400).json({ error: 'Apenas formatos JPG, PNG e WEBP sao aceitos' });
      }
      
      // Generate unique filename with sanitized name (prevents S3 403 errors)
      const timestamp = Date.now();
      const filename = `products/${timestamp}-${sanitizeFilename(originalname)}`;

      // Upload to S3
      const { url } = await storagePut(filename, buffer, mimetype);

      res.json({ url });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Falha ao fazer upload da imagem' });
    }
  });
  // Upload endpoint para arte do cliente — aceita todos os formatos gráficos
  const uploadArt = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  });
  app.post('/api/upload-art', uploadArt.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
      const { originalname, buffer, mimetype } = req.file;
      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'application/postscript', // .ai, .eps
        'application/illustrator',
        'image/vnd.adobe.photoshop', // .psd
        'application/x-photoshop',
        'application/octet-stream', // .cdr, .ai, .psd genérico
        'application/x-coreldraw',
        'application/vnd.corel-draw',
      ];
      // Também verificar extensão para formatos que chegam como octet-stream
      const ext = originalname.split('.').pop()?.toLowerCase() ?? '';
      const allowedExts = ['pdf', 'ai', 'cdr', 'psd', 'eps', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'tif', 'tiff'];
      if (!allowedMimeTypes.includes(mimetype) && !allowedExts.includes(ext)) {
        return res.status(400).json({ error: 'Formato não suportado. Use PDF, AI, CDR, PSD, EPS, JPG ou PNG' });
      }
      const timestamp = Date.now();
      // Sanitizar nome: substituir espaços e caracteres especiais por underscores
      // Isso evita o erro 403 do S3/CloudFront para arquivos com espaços
      const sanitizedName = originalname
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remover acentos
        .replace(/[^a-zA-Z0-9._-]/g, '_') // substituir caracteres especiais por _
        .replace(/_+/g, '_') // colapsar múltiplos _ em um
        .replace(/^_|_$/g, ''); // remover _ no início/fim
      const filename = `client-art/${timestamp}-${sanitizedName || 'arquivo'}`;
      const { url, key } = await storagePut(filename, buffer, mimetype || 'application/octet-stream');

      // Se orderItemId foi enviado, salva a URL no item, atualiza status e notifica operador
      const orderItemId = req.body?.orderItemId ? Number(req.body.orderItemId) : null;
      if (orderItemId && !isNaN(orderItemId)) {
        try {
          const { getDb } = await import('../db.js');
          const { orderItems } = await import('../../drizzle/schema.js');
          const { eq } = await import('drizzle-orm');
          const db = await getDb();
          if (db) {
            // Busca dados do item para notificação
            const itemRows = await db.select().from(orderItems).where(eq(orderItems.id, orderItemId)).limit(1);
            const item = itemRows[0];
            // Salva URL do arquivo e muda status para "nova_arte_reenviada"
            await db.update(orderItems)
              .set({
                artFileUrl: url,
                preProductionStatus: 'nova_arte_reenviada',
                requireClientResend: false,
                correctionAction: null,
              } as any)
              .where(eq(orderItems.id, orderItemId));
            // Registra log no histórico do item
            try {
              const { orderItemLogs } = await import('../../drizzle/schema.js');
              const orderId2 = (item as any)?.orderId;
              if (orderId2) {
                await db.insert(orderItemLogs).values({
                  orderItemId,
                  orderId: orderId2,
                  action: 'O cliente reenviou uma nova arte',
                  operatorName: 'Sistema',
                  createdAt: Date.now(),
                } as any);
              }
            } catch (logErr) {
              console.error('Erro ao registrar log de reenvio:', logErr);
            }
            // Notifica o operador
            try {
              const { notifyOwner } = await import('./notification.js');
              const productName = (item as any)?.productName ?? `Item #${orderItemId}`;
              const orderId = (item as any)?.orderId;
              await notifyOwner({
                title: '📨 Nova Arte Reenviada pelo Cliente',
                content: `O cliente reenviou a arte do produto "${productName}" (Item ID: ${orderItemId}, Pedido ID: ${orderId}). Status atualizado para "Nova Arte Reenviada". Acesse o painel para revisar.`,
              });
            } catch (notifyErr) {
              console.error('Erro ao notificar operador:', notifyErr);
            }
          }
        } catch (dbErr) {
          console.error('Erro ao salvar artFileUrl no item:', dbErr);
          // Não bloqueia a resposta — o upload já foi feito
        }
      }

      res.json({ url, key, orderItemId });
    } catch (error) {
      console.error('Art upload error:', error);
      res.status(500).json({ error: 'Falha ao fazer upload do arquivo' });
    }
  });

  // Upload endpoint para ícones de segmentos — aceita PNG e WebP
  app.post('/api/upload-segment-icon', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
      const { originalname, buffer, mimetype } = req.file;
      const allowedMimeTypes = ['image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(mimetype)) {
        return res.status(400).json({ error: 'Apenas formatos PNG e WebP são aceitos' });
      }
      const timestamp = Date.now();
      const filename = `segment-icons/${timestamp}-${sanitizeFilename(originalname)}`;
      const { url, key } = await storagePut(filename, buffer, mimetype);
      res.json({ url, key });
    } catch (error) {
      console.error('Segment icon upload error:', error);
      res.status(500).json({ error: 'Falha ao fazer upload do ícone' });
    }
  });

  // Bulk reorder endpoint para segmentos — atualiza posições em lote
  app.post('/api/reorder-segments', express.json(), async (req, res) => {
    try {
      const { order } = req.body as { order: { id: number; position: number }[] };
      if (!Array.isArray(order)) return res.status(400).json({ error: 'order deve ser um array' });
      const { getDb } = await import('../db');
      const { segments } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) return res.status(500).json({ error: 'Banco de dados indisponível' });
      for (const item of order) {
        await db.update(segments).set({ position: item.position }).where(eq(segments.id, item.id));
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Reorder segments error:', error);
      res.status(500).json({ error: 'Falha ao reordenar segmentos' });
    }
  });

  // Upload endpoint para prévia de arte (admin) — aceita imagens
  app.post('/api/upload-art-preview', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
      const { originalname, buffer, mimetype } = req.file;
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimeTypes.includes(mimetype)) {
        return res.status(400).json({ error: 'Apenas formatos JPG, PNG, WEBP e GIF são aceitos' });
      }
      const timestamp = Date.now();
      const filename = `art-previews/${timestamp}-${sanitizeFilename(originalname)}`;
      const { url, key } = await storagePut(filename, buffer, mimetype);
      res.json({ url, key });
    } catch (error) {
      console.error('Art preview upload error:', error);
      res.status(500).json({ error: 'Falha ao fazer upload da prévia' });
    }
  });

  // Download proxy — permite que o browser baixe arquivos do S3 com nome original
  app.get('/api/download-file', async (req, res) => {
    try {
      const fileUrl = req.query.url as string;
      const fileName = (req.query.name as string) || 'arquivo';
      if (!fileUrl) return res.status(400).json({ error: 'URL não fornecida' });

      // Detectar extensão pelo nome do arquivo para Content-Type correto
      const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
      const mimeMap: Record<string, string> = {
        pdf: 'application/pdf',
        ai: 'application/postscript',
        eps: 'application/postscript',
        psd: 'image/vnd.adobe.photoshop',
        cdr: 'application/x-coreldraw',
        jpg: 'image/jpeg', jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        tif: 'image/tiff', tiff: 'image/tiff',
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
      };

      // Resolver a chave S3 a partir do caminho /manus-storage/{key}
      let s3Key: string | null = null;
      if (fileUrl.startsWith('/manus-storage/')) {
        s3Key = fileUrl.replace('/manus-storage/', '');
      } else if (!fileUrl.startsWith('http')) {
        s3Key = fileUrl;
      }

      // Gerar URL assinada fresca e fazer stream do arquivo
      // Usar a URL assinada diretamente para evitar problemas de 403
      const signedUrl = s3Key
        ? await storageGetSignedUrl(s3Key)
        : fileUrl;

      // Fazer fetch com a URL assinada fresca
      const response = await fetch(signedUrl, {
        redirect: 'follow',
        headers: { 'User-Agent': 'GraficaPontoDigital/1.0' },
      });

      if (!response.ok) {
        console.error(`Download proxy: upstream error ${response.status} for ${fileName} (key: ${s3Key})`);
        return res.status(502).json({ error: `Erro ao acessar arquivo: ${response.status}` });
      }

      const contentLength = response.headers.get('content-length');

      // Forçar download com nome original — suporte universal Chrome/Edge/Firefox
      // Usar filename= simples + filename*= RFC5987 para nomes com caracteres especiais
      const escapedFileName = fileName.replace(/"/g, '\\"');
      const encodedFileName = encodeURIComponent(fileName);
      res.setHeader('Content-Disposition',
        `attachment; filename="${escapedFileName}"; filename*=UTF-8''${encodedFileName}`);
      // application/octet-stream impede o navegador de tentar abrir o arquivo
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (contentLength) res.setHeader('Content-Length', contentLength);

      // Stream do arquivo diretamente para o cliente
      if (response.body) {
        const { Readable } = await import('stream');
        const readable = Readable.fromWeb(response.body as any);
        readable.pipe(res);
        readable.on('error', (err) => {
          console.error('Stream error during download:', err);
          if (!res.headersSent) res.status(500).end();
        });
      } else {
        res.status(502).json({ error: 'Resposta vazia do servidor de arquivos' });
      }
    } catch (error) {
      console.error('Download proxy error:', error);
      res.status(500).json({ error: 'Falha ao baixar arquivo' });
    }
  });

    // Melhor Envio OAuth2 Callback — removido (módulo reiniciado)

  // ── Mercado Pago Webhook IPN ──────────────────────────────────────────────────
  app.post('/api/payments/mercadopago/webhook', async (req, res) => {
    try {
      const { type, data } = req.body || {};
      console.log('[MP Webhook] Received:', type, data);

      if ((type === 'payment' || type === 'payment.updated') && data?.id) {
        const { getDb } = await import('../db.js');
        const { orders: ordersT, orderPayments: orderPaymentsT, storeSettings: storeSettingsT } = await import('../../drizzle/schema.js');
        const { eq: eqOp } = await import('drizzle-orm');
        const { updateOrderStatus } = await import('../db.js');

        const db = await getDb();
        if (!db) { res.sendStatus(200); return; }

        // Get access token from DB or env
        let accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
        try {
          const settingsRows = await db.select().from(storeSettingsT).limit(1);
          if (settingsRows[0]?.mercadopagoAccessToken) accessToken = settingsRows[0].mercadopagoAccessToken;
        } catch { /* ignore */ }

        if (!accessToken) { res.sendStatus(200); return; }

        const MercadoPagoConfig = (await import('mercadopago')).default;
        const { Payment } = await import('mercadopago');
        const client = new MercadoPagoConfig({ accessToken });
        const paymentApi = new Payment(client);
        const payment = await paymentApi.get({ id: String(data.id) });

        // Update payment record
        try {
          await db.update(orderPaymentsT)
            .set({ status: payment.status || 'unknown', updatedAt: Date.now() })
            .where(eqOp(orderPaymentsT.paymentId, String(data.id)));
        } catch { /* ignore if not found */ }

        if (payment.status === 'approved' && payment.external_reference) {
          const orderId = Number(payment.external_reference);
          await updateOrderStatus(orderId, 'pagamento_aprovado', 'Pagamento aprovado via Mercado Pago (webhook)');
          console.log(`[MP Webhook] Pedido ${orderId} aprovado`);

          // Disparar e-mail de confirmação de pagamento PIX com identidade visual rosa
          try {
            const { orders: ordersTable, customerAccounts: custTable } = await import('../../drizzle/schema.js');
            const orderRows = await db.select().from(ordersTable).where(eqOp(ordersTable.id, orderId)).limit(1);
            const ord = orderRows[0];
            if (ord) {
              const { sendPixPaymentConfirmedEmail } = await import('../emailService.js');
              const SITE_URL = 'https://mariaimprime.com.br';
              const guestToken = (ord as any).guestToken;
              const orderNumber = (ord as any).orderNumber ?? String(orderId);
              const trackUrl = guestToken
                ? `${SITE_URL}/pedido/acompanhar/${guestToken}`
                : `${SITE_URL}/pedido/${orderNumber}`;
              const totalPago = Number((ord as any).totalPrice ?? 0).toFixed(2);

              // Buscar e-mail e nome do cliente
              let emailTo: string | null = (ord as any).guestEmail ?? null;
              let firstName = ((ord as any).guestName ?? 'Cliente').split(' ')[0];
              if (!emailTo && (ord as any).customerId) {
                const [ca] = await db.select({ email: custTable.email, firstName: custTable.firstName })
                  .from(custTable)
                  .where(eqOp(custTable.id, (ord as any).customerId))
                  .limit(1);
                if (ca?.email) { emailTo = ca.email; firstName = ca.firstName || firstName; }
              }
              if (emailTo) {
                await sendPixPaymentConfirmedEmail(emailTo, firstName, orderNumber, totalPago, trackUrl);
                console.log(`[MP Webhook] E-mail de confirmação PIX enviado para ${emailTo}`);
              } else {
                console.log('[MP Webhook] Sem e-mail do cliente para enviar confirmação PIX');
              }
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Erro ao enviar e-mail de confirmação PIX:', emailErr);
          }
        }
      }

      res.sendStatus(200);
    } catch (err) {
      console.error('[MP Webhook] Erro:', err);
      res.sendStatus(200); // Always 200 to avoid MP retries
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
