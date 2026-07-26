import type { Coupon } from "@/types";

export const coupons: Coupon[] = [
  { code: "BEMVINDO10", kind: "percent", value: 10, description: "10% no primeiro pedido" },
  { code: "FRETE0", kind: "fixed", value: 6.9, minOrder: 30, description: "Frete grátis acima de R$ 30" },
  { code: "AZUL15", kind: "percent", value: 15, minOrder: 50, description: "15% em pedidos acima de R$ 50" },
];
