import { router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";

/**
 * Router de upload de arte via URL pré-assinada.
 * O cliente faz PUT direto ao S3, contornando o limite de payload do gateway (HTTP 413).
 */
export const artUploadRouter = router({
  /**
   * Gera URL pré-assinada para upload direto ao S3 pelo cliente.
   * Retorna: { uploadUrl, storageUrl, contentType }
   */
  getPresignedUrl: publicProcedure
    .input(z.object({
      filename: z.string(),
      contentType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const forgeUrl = (ENV.forgeApiUrl ?? "").replace(/\/+$/, "");
      const forgeKey = ENV.forgeApiKey ?? "";

      if (!forgeUrl || !forgeKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Storage config missing: BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY not set",
        });
      }

      // Sanitizar nome do arquivo para evitar erros no S3
      const sanitized = input.filename
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "") || "arquivo";

      const hash = Math.random().toString(36).slice(2, 10);
      const dotIdx = sanitized.lastIndexOf(".");
      const ext = dotIdx !== -1 ? sanitized.slice(dotIdx) : "";
      const base = dotIdx !== -1 ? sanitized.slice(0, dotIdx) : sanitized;
      const key = `client-art/${Date.now()}-${base}_${hash}${ext}`;

      // Obter URL pré-assinada do Forge
      const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
      presignUrl.searchParams.set("path", key);

      const presignResp = await fetch(presignUrl.toString(), {
        headers: { Authorization: `Bearer ${forgeKey}` },
      });

      if (!presignResp.ok) {
        const msg = await presignResp.text().catch(() => presignResp.statusText);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Presign failed (${presignResp.status}): ${msg}`,
        });
      }

      const { url: s3Url } = (await presignResp.json()) as { url: string };
      if (!s3Url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Forge returned empty presign URL",
        });
      }

      return {
        uploadUrl: s3Url,
        storageUrl: `/manus-storage/${key}`,
        contentType: input.contentType,
      };
    }),
});
