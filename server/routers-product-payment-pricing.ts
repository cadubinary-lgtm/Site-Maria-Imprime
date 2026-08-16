import { router } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";
import { z } from "zod";
import { applyPixDiscountToProducts } from "./db";

const adminAnyProcedure = adminOrManusAuthProcedure;

export const productPaymentPricingRouter = router({
  applyPixDiscount: adminAnyProcedure
    .input(z.object({
      discountPercent: z.number().min(0, "Informe um percentual válido").max(99.99, "O desconto deve ser menor que 100%"),
      productIds: z.array(z.number()).min(1).optional(),
    }))
    .mutation(async ({ input }) => {
      return applyPixDiscountToProducts(input.discountPercent, input.productIds);
    }),
});
