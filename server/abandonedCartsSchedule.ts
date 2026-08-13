import type { Request, Response } from "express";
import { cleanupExpiredAbandonedCarts } from "./db";
import { sdk } from "./_core/sdk";

/** Endpoint exclusivo para a rotina automática que remove carrinhos com mais de 48 horas. */
export async function cleanupAbandonedCartsScheduled(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const result = await cleanupExpiredAbandonedCarts();
    return res.json({ ok: true, ...result, taskUid: user.taskUid });
  } catch (error: any) {
    console.error("[abandoned-carts] Erro na limpeza automática:", error);
    return res.status(500).json({
      error: error?.message ?? "Falha ao limpar carrinhos abandonados",
      timestamp: new Date().toISOString(),
    });
  }
}
