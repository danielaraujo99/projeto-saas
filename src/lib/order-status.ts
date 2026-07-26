export type OrderStatus =
  | "pending_payment"
  | "received"
  | "preparing"
  | "delivering"
  | "delivered";

export const ACTIVE_STATUSES: OrderStatus[] = ["received", "preparing", "delivering"];
export const TIMELINE: OrderStatus[] = ["received", "preparing", "delivering", "delivered"];

export const statusLabel: Record<OrderStatus, string> = {
  pending_payment: "Aguardando pagamento",
  received: "Pedido confirmado pelo restaurante",
  preparing: "Pedido em preparo",
  delivering: "Saiu para entrega",
  delivered: "Entregue",
};

// Elapsed-time thresholds (ms) after payment_confirmed_at.
// Kept short so the simulation is visible; real integrations will overwrite `status` from a restaurant panel.
const THRESHOLDS: Array<{ status: OrderStatus; afterMs: number }> = [
  { status: "received", afterMs: 0 },
  { status: "preparing", afterMs: 20_000 },
  { status: "delivering", afterMs: 60_000 },
  { status: "delivered", afterMs: 150_000 },
];

/** Given the payment_confirmed_at timestamp, compute the simulated status now. */
export function computeStatus(paymentConfirmedAt: string | null | undefined): OrderStatus {
  if (!paymentConfirmedAt) return "pending_payment";
  const elapsed = Date.now() - new Date(paymentConfirmedAt).getTime();
  let current: OrderStatus = "received";
  for (const t of THRESHOLDS) {
    if (elapsed >= t.afterMs) current = t.status;
  }
  return current;
}
