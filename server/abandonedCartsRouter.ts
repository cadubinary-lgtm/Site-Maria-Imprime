import { router } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";
import { z } from "zod";
import { cleanupExpiredAbandonedCarts, deleteAbandonedCart, getAbandonedCartDetails, getAbandonedCartSummaries, recordAbandonedCartReminder } from "./db";
import { sendAbandonedCartReminderEmail } from "./emailService";
import { TRPCError } from "@trpc/server";

const adminProcedure = adminOrManusAuthProcedure;
const cartIdentitySchema = z.object({
  userId: z.number().nullable(),
  sessionId: z.string().nullable(),
}).refine((identity) => identity.userId !== null || Boolean(identity.sessionId), {
  message: "Identificação do carrinho é obrigatória",
});

export const abandonedCartsRouter = router({
  list: adminProcedure.query(async () => getAbandonedCartSummaries()),
  details: adminProcedure.input(cartIdentitySchema).query(async ({ input }) => getAbandonedCartDetails(input)),
  deleteOne: adminProcedure.input(cartIdentitySchema).mutation(async ({ input }) => deleteAbandonedCart(input)),
  sendEmailReminder: adminProcedure.input(cartIdentitySchema).mutation(async ({ input }) => {
    const details = await getAbandonedCartDetails(input);
    if (!details.customer?.email) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Este carrinho não possui e-mail cadastrado." });
    }
    const total = details.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const products = details.items.map((item) => item.productName).join(", ");
    const result = await sendAbandonedCartReminderEmail(
      details.customer.email,
      details.customer.firstName || details.customer.name || "cliente",
      products,
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)
    );
    if (!result.success) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Não foi possível enviar o lembrete." });
    }
    await recordAbandonedCartReminder(input, "email", details.customer.email, "sent");
    return { success: true, email: details.customer.email };
  }),
  markWhatsAppReminderOpened: adminProcedure.input(cartIdentitySchema.safeExtend({ recipient: z.string().min(5) })).mutation(async ({ input }) => {
    await recordAbandonedCartReminder(input, "whatsapp", input.recipient, "prepared");
    return { success: true };
  }),
  cleanupExpired: adminProcedure.mutation(async () => cleanupExpiredAbandonedCarts()),
});
