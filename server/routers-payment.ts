/**
 * Payment Router — Mercado Pago PIX + Credit Card
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { orders, orderPayments, storeSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  createPixPayment,
  createCardPayment,
  getPaymentStatus,
} from "./mercadopago";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
  return db as NonNullable<typeof db>;
}

async function getMPAccessToken(): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
    const rows = await db.select().from(storeSettings).limit(1);
    if (rows.length > 0 && rows[0].mercadopagoAccessToken) {
      return rows[0].mercadopagoAccessToken;
    }
  } catch { /* fall through */ }
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
}

async function getMPPublicKey(): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return process.env.MERCADO_PAGO_PUBLIC_KEY || "";
    const rows = await db.select().from(storeSettings).limit(1);
    if (rows.length > 0 && rows[0].mercadopagoPublicKey) {
      return rows[0].mercadopagoPublicKey;
    }
  } catch { /* fall through */ }
  return process.env.MERCADO_PAGO_PUBLIC_KEY || "";
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const paymentRouter = router({
  // Returns the public key for the frontend MP.js SDK
  getPublicKey: publicProcedure.query(async () => {
    const key = await getMPPublicKey();
    return { publicKey: key };
  }),

  // ── PIX ──────────────────────────────────────────────────────────────────
  createPixPayment: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      payerCpf: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const orderRows = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!orderRows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      const order = orderRows[0];

      const accessToken = await getMPAccessToken();
      const result = await createPixPayment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalPrice),
        payerEmail: ctx.user.email || "cliente@graficapontodigital.com.br",
        payerName: ctx.user.name || "Cliente",
        payerCpf: input.payerCpf,
        accessToken,
      });

      await db.insert(orderPayments).values({
        orderId: order.id,
        paymentId: result.paymentId,
        method: "pix",
        status: result.status,
        amount: String(order.totalPrice),
        qrCode: result.qrCode,
        qrCodeBase64: result.qrCodeBase64,
        expiresAt: result.expiresAt,
        createdAt: Date.now(),
      });

      return result;
    }),

  // ── Credit Card ───────────────────────────────────────────────────────────
  createCardPayment: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      token: z.string(),
      installments: z.number().min(1).max(12),
      paymentMethodId: z.string(),
      issuerId: z.string().optional(),
      payerCpf: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const orderRows = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!orderRows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      const order = orderRows[0];

      const accessToken = await getMPAccessToken();
      const result = await createCardPayment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalPrice),
        token: input.token,
        installments: input.installments,
        paymentMethodId: input.paymentMethodId,
        issuerId: input.issuerId,
        payerEmail: ctx.user.email || "cliente@graficapontodigital.com.br",
        payerName: ctx.user.name || "Cliente",
        payerCpf: input.payerCpf,
        accessToken,
      });

      await db.insert(orderPayments).values({
        orderId: order.id,
        paymentId: result.paymentId,
        method: "credit_card",
        status: result.status,
        amount: String(order.totalPrice),
        installments: result.installments,
        lastFourDigits: result.lastFourDigits,
        createdAt: Date.now(),
      });

      // If approved immediately, update order status
      if (result.status === "approved") {
        await db
          .update(orders)
          .set({ status: "pagamento_aprovado", paymentStatus: "pago" })
          .where(eq(orders.id, order.id));
      }

      return result;
    }),

  // ── Poll PIX status ───────────────────────────────────────────────────────
  getPixStatus: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      const accessToken = await getMPAccessToken();
      return getPaymentStatus(input.paymentId, accessToken);
    }),

  // ── Get payment for order ─────────────────────────────────────────────────
  getOrderPayment: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const rows = await db
        .select()
        .from(orderPayments)
        .where(eq(orderPayments.orderId, input.orderId))
        .orderBy(orderPayments.createdAt)
        .limit(1);
      return rows[0] || null;
    }),

  // ── Admin: get MP settings ────────────────────────────────────────────────
  getSettings: protectedProcedure.query(async () => {
    const db = await requireDb();
    const rows = await db.select().from(storeSettings).limit(1);
    const s = rows[0];
    return {
      hasAccessToken: !!(s?.mercadopagoAccessToken),
      publicKey: s?.mercadopagoPublicKey ?? "",
      sandbox: s?.mercadopagoSandbox ?? true,
      pixEnabled: s?.mercadopagoPixEnabled ?? true,
      cardEnabled: s?.mercadopagoCardEnabled ?? true,
      hasWebhookSecret: !!(s?.mercadopagoWebhookSecret),
    };
  }),

  // ── Admin: save MP settings ───────────────────────────────────────────────
  saveSettings: protectedProcedure
    .input(z.object({
      accessToken: z.string().optional(),
      publicKey: z.string(),
      sandbox: z.boolean(),
      pixEnabled: z.boolean(),
      cardEnabled: z.boolean(),
      webhookSecret: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const rows = await db.select().from(storeSettings).limit(1);
      const updateData: Record<string, unknown> = {
        mercadopagoPublicKey: input.publicKey,
        mercadopagoSandbox: input.sandbox,
        mercadopagoPixEnabled: input.pixEnabled,
        mercadopagoCardEnabled: input.cardEnabled,
      };
      if (input.accessToken) updateData.mercadopagoAccessToken = input.accessToken;
      if (input.webhookSecret) updateData.mercadopagoWebhookSecret = input.webhookSecret;

      if (rows.length > 0) {
        await db.update(storeSettings).set(updateData as any).where(eq(storeSettings.id, rows[0].id));
      } else {
        await db.insert(storeSettings).values(updateData as any);
      }
      return { ok: true };
    }),

  // ── Admin: test MP connection ─────────────────────────────────────────────
  testConnection: protectedProcedure.mutation(async () => {
    const accessToken = await getMPAccessToken();
    if (!accessToken) throw new TRPCError({ code: "BAD_REQUEST", message: "Access Token não configurado." });

    try {
      const resp = await fetch("https://api.mercadopago.com/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json() as { email?: string; site_id?: string };
      const db = await requireDb();
      const rows = await db.select().from(storeSettings).limit(1);
      const sandbox = rows[0]?.mercadopagoSandbox ?? true;
      return { email: data.email ?? "Desconhecido", sandbox };
    } catch (err: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Falha na conexão: ${err.message}` });
    }
  }),
});
