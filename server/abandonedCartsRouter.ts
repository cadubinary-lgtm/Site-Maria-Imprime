import { router } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";
import { z } from "zod";
import { cleanupExpiredAbandonedCarts, deleteAbandonedCart, getAbandonedCartDetails, getAbandonedCartSummaries } from "./db";

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
  cleanupExpired: adminProcedure.mutation(async () => cleanupExpiredAbandonedCarts()),
});
