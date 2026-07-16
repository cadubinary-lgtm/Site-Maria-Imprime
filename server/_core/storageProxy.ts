import type { Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const data = await forgeResp.json() as { url?: string };
      const url = data.url;
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      // Se ?download=nome está presente, fazer stream com Content-Disposition
      // para forçar download com nome original (sem redirect — evita 403 do S3)
      const downloadName = req.query.download as string | undefined;
      if (downloadName) {
        const fileResp = await fetch(url, { redirect: "follow" });
        if (!fileResp.ok) {
          console.error(`[StorageProxy] S3 download error: ${fileResp.status} for key: ${key}`);
          res.status(502).send(`Storage error: ${fileResp.status}`);
          return;
        }
        const escapedName = downloadName.replace(/"/g, '\\"');
        const encodedName = encodeURIComponent(downloadName);
        res.set("Content-Disposition", `attachment; filename="${escapedName}"; filename*=UTF-8''${encodedName}`);
        res.set("Content-Type", "application/octet-stream");
        res.set("Cache-Control", "no-store");
        res.set("X-Content-Type-Options", "nosniff");
        const contentLength = fileResp.headers.get("content-length");
        if (contentLength) res.set("Content-Length", contentLength);
        if (fileResp.body) {
          const { Readable } = await import("stream");
          const readable = Readable.fromWeb(fileResp.body as any);
          readable.pipe(res);
          readable.on("error", (err) => {
            console.error("[StorageProxy] stream error:", err);
            if (!res.headersSent) res.status(500).end();
          });
        } else {
          res.status(502).send("Empty file body");
        }
        return;
      }

      // Sem ?download — comportamento padrão: redirect 307 para visualização
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
