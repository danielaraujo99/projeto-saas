import { supabase } from "@/integrations/supabase/client";
import type { OrderRow } from "@/lib/orders-api";

export type AdminOrderStatus =
  | "pending_payment"
  | "received"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "delivered"
  | "canceled";

export const KANBAN_COLUMNS: { id: AdminOrderStatus; label: string; hint?: string }[] = [
  { id: "received", label: "Recebidos", hint: "Aguardando confirmação" },
  { id: "confirmed", label: "Confirmados" },
  { id: "preparing", label: "Em preparo" },
  { id: "delivering", label: "Saída / Retirada" },
  { id: "delivered", label: "Concluídos" },
  { id: "canceled", label: "Cancelados" },
];

export const STATUS_LABEL: Record<AdminOrderStatus, string> = {
  pending_payment: "Aguardando pagamento",
  received: "Recebido",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  delivering: "Saiu para entrega",
  delivered: "Concluído",
  canceled: "Cancelado",
};

// Fluxo linear de avanço no Kanban.
export const NEXT_STATUS: Partial<Record<AdminOrderStatus, AdminOrderStatus>> = {
  received: "confirmed",
  confirmed: "preparing",
  preparing: "delivering",
  delivering: "delivered",
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
