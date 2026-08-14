export type ShippingSummaryInput = {
  selectedShipping: { price?: number | string | null } | null;
  shippingCalculated: boolean;
};

export function getShippingSummary({ selectedShipping, shippingCalculated }: ShippingSummaryInput) {
  if (!selectedShipping) {
    return {
      amount: 0,
      label: shippingCalculated ? "Selecione a entrega" : "Calcule o frete",
      isFree: false,
      isPending: true,
    };
  }

  const amount = Math.max(0, Number(selectedShipping.price ?? 0));
  return {
    amount,
    label: amount === 0 ? "Grátis" : `R$ ${amount.toFixed(2)}`,
    isFree: amount === 0,
    isPending: false,
  };
}

export function getOrderTotal(subtotal: number, shippingAmount: number): number {
  return Math.max(0, subtotal) + Math.max(0, shippingAmount);
}
