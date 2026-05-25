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
import { storagePut } from "../storage";

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
  
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
      }

      const { originalname, buffer, mimetype } = req.file;
      
      // Validar formato de imagem
      const allowedMimeTypes = ['image/jpeg', 'image/png'];
      if (!allowedMimeTypes.includes(mimetype)) {
        return res.status(400).json({ error: 'Apenas formatos JPG e PNG sao aceitos' });
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `products/${timestamp}-${originalname}`;

      // Upload to S3
      const { url } = await storagePut(filename, buffer, mimetype);

      res.json({ url });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Falha ao fazer upload da imagem' });
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
      const filename = `art-previews/${timestamp}-${originalname}`;
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
      // Apenas permite URLs do próprio storage
      const axios = (await import('axios')).default;
      const response = await axios.get(fileUrl, { responseType: 'stream', timeout: 30000 });
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      (response.data as any).pipe(res);
    } catch (error) {
      console.error('Download proxy error:', error);
      res.status(500).json({ error: 'Falha ao baixar arquivo' });
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
