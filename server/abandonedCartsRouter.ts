import { router } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";
import { cleanupExpiredAbandonedCarts, getAbandonedCartSummaries } from "./db";

const adminProcedure = adminOrManusAuthProcedure;

export const abandonedCartsRouter = router({
  list: adminProcedure.query(async () => getAbandonedCartSummaries()),
  cleanupExpired: adminProcedure.mutation(async () => cleanupExpiredAbandonedCarts()),
});
