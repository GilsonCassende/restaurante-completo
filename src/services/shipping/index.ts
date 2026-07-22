import type { DeliveryFee, DeliveryZone } from "@/types";

export type DeliveryFeeEstimateInput = {
  orderTotal: number;
  distanceKm: number;
  zone: DeliveryZone | null;
  fees: DeliveryFee[];
};

export type DeliveryFeeEstimate = {
  amount: number;
  freeShipping: boolean;
  reason: string;
  appliedFee: DeliveryFee | null;
};

export function calculateDeliveryFee(input: DeliveryFeeEstimateInput): DeliveryFeeEstimate {
  const eligibleFees = input.fees.filter((fee) => fee.active);
  const zoneFee = eligibleFees.find((fee) => fee.zoneId && input.zone && fee.zoneId === input.zone.id);
  const freeShippingFee = eligibleFees.find((fee) => fee.type === "FREE_SHIPPING");

  if (freeShippingFee && input.orderTotal >= (freeShippingFee.freeShippingThreshold ?? Infinity)) {
    return {
      amount: 0,
      freeShipping: true,
      reason: "Pedido elegível para frete grátis.",
      appliedFee: freeShippingFee,
    };
  }

  if (input.zone?.minOrderAmount && input.orderTotal < input.zone.minOrderAmount) {
    const amount = zoneFee?.fixedAmount ?? eligibleFees.find((fee) => fee.type === "MINIMUM_ORDER")?.fixedAmount ?? 0;
    return {
      amount,
      freeShipping: false,
      reason: "Pedido abaixo do valor mínimo para a zona selecionada.",
      appliedFee: zoneFee ?? eligibleFees.find((fee) => fee.type === "MINIMUM_ORDER") ?? null,
    };
  }

  const fixedFee = zoneFee?.fixedAmount ?? eligibleFees.find((fee) => fee.type === "FIXED")?.fixedAmount ?? 0;
  const distanceFee = eligibleFees.find((fee) => fee.type === "DISTANCE");
  const distanceAmount = distanceFee?.perKmAmount ? distanceFee.perKmAmount * Math.max(input.distanceKm, 0) : 0;
  const amount = Number((fixedFee + distanceAmount).toFixed(2));

  return {
    amount,
    freeShipping: amount === 0,
    reason: zoneFee ? `Tarifa calculada para a zona ${input.zone?.name ?? "selecionada"}.` : "Tarifa calculada com base na distância.",
    appliedFee: zoneFee ?? distanceFee ?? eligibleFees.find((fee) => fee.type === "FIXED") ?? null,
  };
}

