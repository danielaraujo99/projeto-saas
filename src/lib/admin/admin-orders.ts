import { supabase } from "@/lib/custom-supabase";
import type { OrderRow } from "@/lib/orders-api";

export type AdminOrderStatus =
  | "pending_payment"
  | "received"
  | "confirmed"
  | "preparing"
  | "canceled"
  | "delivering"
  | "delivered"
  | "concluded";

export const KANBAN_COLUMNS: { id: AdminOrderStatus; label: string; hint?: string }[] = [
  { id: "received", label: "Pedido feito", hint: "Novo pedido" },
  { id: "preparing", label: "Em preparo" },
  { id: "canceled", label: "Cancelado" },
  { id: "delivering", label: "Saiu pra entrega" },
  { id: "delivered", label: "Entregue" },
  { id: "concluded", label: "Concluídos" },
];

export const STATUS_LABEL: Record<AdminOrderStatus, string> = {
  pending_payment: "Aguardando pagamento",
  received: "Pedido feito",
  confirmed: "Pedido feito",
  preparing: "Em preparo",
  canceled: "Cancelado",
  delivering: "Saiu pra entrega",
  delivered: "Entregue",
  concluded: "Concluído",
};

// Fluxo linear de avanço no Kanban.
export const NEXT_STATUS: Partial<Record<AdminOrderStatus, AdminOrderStatus>> = {
  received: "preparing",
  confirmed: "preparing",
  preparing: "delivering",
  delivering: "delivered",
  delivered: "concluded",
};

function parseRow(row: Record<string, unknown>): OrderRow {
  return {
    ...row,
    items: (row.items ?? []) as OrderRow["items"],
    address: (row.address ?? null) as OrderRow["address"],
    payment: row.payment as OrderRow["payment"],
    subtotal: Number(row.subtotal),
    delivery_fee: Number(row.delivery_fee),
    discount: Number(row.discount),
    total: Number(row.total),
  } as OrderRow;
}

export async function listRestaurantOrders(restaurantId: string): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => parseRow(r as Record<string, unknown>));
}

export async function updateOrderStatus(id: string, status: AdminOrderStatus) {
  const { error } = await supabase
    .from("orders")
    .update({ status, status_updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
