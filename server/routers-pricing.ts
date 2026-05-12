import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  processPricingCalculation,
  applyVolumeDiscount,
  calculateTaxes,
  validateAttributeCombination,
  type PriceCalculationType,
} from "./attributes-pricing";

export const pricingRouter = router({
  /**
   * Calcular preço final com atributos selecionados
   */
  calculatePrice: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        basePrice: z.number().min(0),
        selectedAttributeIds: z.array(z.number()),
        quantity: z.number().min(1).optional(),
        area: z.number().min(0).optional(),
        calculationType: z.enum(["fixed", "percentage", "multiplier", "per_sqm", "per_quantity"]).optional(),
      })
    )
    .query(async ({ input }: any) => {
      try {
        // Validar combinação de atributos
        const validation = await validateAttributeCombination(input.productId, input.selectedAttributeIds);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(", "));
        }

        // Calcular preço com atributos
        const pricing = await processPricingCalculation({
          basePrice: input.basePrice,
          selectedAttributeIds: input.selectedAttributeIds,
          quantity: input.quantity,
          area: input.area,
            calculationType: (input.calculationType as PriceCalculationType) || "fixed",
        });

        // Aplicar desconto por volume se quantidade foi fornecida
        let finalPrice = pricing.finalPrice;
        let volumeDiscount = { discountPercentage: 0, discountAmount: 0, finalPriceWithDiscount: finalPrice };

        if (input.quantity && input.quantity > 1) {
          volumeDiscount = applyVolumeDiscount(pricing.finalPrice, input.quantity);
          finalPrice = volumeDiscount.finalPriceWithDiscount;
        }

        // Calcular impostos
        const taxes = calculateTaxes(finalPrice);

        return {
          success: true,
          pricing: {
            basePrice: pricing.basePrice,
            attributeModifiers: pricing.attributeModifiers,
            totalModifier: pricing.totalModifier,
            priceWithModifiers: pricing.finalPrice,
            volumeDiscount,
            subtotal: finalPrice,
            taxes,
            finalPrice: taxes.priceWithTax,
            deadlineModifier: pricing.deadlineModifier,
            weightModifier: pricing.weightModifier,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Erro ao calcular preço",
        };
      }
    }),

  /**
   * Calcular preço para múltiplos produtos (carrinho)
   */
  calculateCartTotal: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.number(),
            basePrice: z.number().min(0),
            selectedAttributeIds: z.array(z.number()),
            quantity: z.number().min(1),
          })
        ),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const cartItems = await Promise.all(
          input.items.map(async (item: any) => {
            const pricing = await processPricingCalculation({
              basePrice: item.basePrice,
              selectedAttributeIds: item.selectedAttributeIds,
              quantity: item.quantity,
            });

            const volumeDiscount = applyVolumeDiscount(pricing.finalPrice, item.quantity);
            const subtotal = volumeDiscount.finalPriceWithDiscount;
            const taxes = calculateTaxes(subtotal);

            return {
              productId: item.productId,
              quantity: item.quantity,
              basePrice: item.basePrice,
              priceWithModifiers: pricing.finalPrice,
              volumeDiscount: volumeDiscount.discountPercentage,
              discountAmount: volumeDiscount.discountAmount,
              subtotal,
              taxes: taxes.taxAmount,
              total: taxes.priceWithTax,
            };
          })
        );

        const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        const totalTaxes = cartItems.reduce((sum, item) => sum + item.taxes, 0);
        const totalDiscount = cartItems.reduce((sum, item) => sum + item.discountAmount, 0);

        return {
          success: true,
          items: cartItems,
          summary: {
            subtotal: cartItems.reduce((sum, item) => sum + item.subtotal, 0),
            totalDiscount,
            totalTaxes,
            total: cartTotal,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Erro ao calcular total do carrinho",
        };
      }
    }),

  /**
   * Obter tabela de descontos por volume
   */
  getVolumeDiscountTable: publicProcedure.query(() => {
    return {
      discounts: [
        { quantity: 1, discount: 0 },
        { quantity: 20, discount: 2 },
        { quantity: 50, discount: 5 },
        { quantity: 100, discount: 7 },
        { quantity: 250, discount: 10 },
        { quantity: 500, discount: 12 },
        { quantity: 1000, discount: 15 },
      ],
    };
  }),

  /**
   * Validar combinação de atributos (admin)
   */
  validateAttributeCombination: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        selectedAttributeIds: z.array(z.number()),
      })
    )
    .query(async ({ input }: any) => {
      const validation = await validateAttributeCombination(input.productId, input.selectedAttributeIds);
      return validation;
    }),
});
