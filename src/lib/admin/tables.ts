import { supabase } from "@/lib/custom-supabase";

export type TableStatus = "free" | "occupied" | "reserved";

export type TableRow = {
  id: string;
  restaurant_id: string;
  number: number;
  seats: number;
  status: TableStatus;
  pos_x: number;
  pos_y: number;
  waiter_id: string | null;
  opened_at: string | null;
  reservation_name: string | null;
  reservation_time: string | null;
};

export type TableItem = {
  id: string;
  table_id: string;
  name: string;
  qty: number;
  price: number;
  notes: string | null;
  created_at: string;
};

export async function listTables(restaurantId: string): Promise<TableRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TableRow[];
}

export async function createTable(input: {
  restaurant_id: string;
  number: number;
  seats: number;
  pos_x?: number;
  pos_y?: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("tables").insert(input);
  if (error) throw error;
}

export async function updateTable(id: string, patch: Partial<TableRow>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("tables").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTable(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("tables").delete().eq("id", id);
  if (error) throw error;
}

export async function openTable(id: string, waiterId: string | null) {
  await updateTable(id, {
    status: "occupied",
    waiter_id: waiterId,
    opened_at: new Date().toISOString(),
  });
}

export async function closeTable(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("table_order_items").delete().eq("table_id", id);
  await updateTable(id, {
    status: "free",
    waiter_id: null,
    opened_at: null,
  });
}

export async function transferTable(fromId: string, toId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = supabase as any;
  const { data: fromT } = await supa.from("tables").select("*").eq("id", fromId).single();
  const { data: toT } = await supa.from("tables").select("*").eq("id", toId).single();
  if (!fromT || !toT) throw new Error("Mesa não encontrada");
  if (toT.status !== "free") throw new Error("Destino não está livre");
  await supa.from("table_order_items").update({ table_id: toId }).eq("table_id", fromId);
  await updateTable(toId, {
    status: "occupied",
    waiter_id: fromT.waiter_id,
    opened_at: fromT.opened_at,
  });
  await updateTable(fromId, {
    status: "free",
    waiter_id: null,
    opened_at: null,
  });
}

export async function mergeTables(sourceId: string, targetId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = supabase as any;
  await supa.from("table_order_items").update({ table_id: targetId }).eq("table_id", sourceId);
  await updateTable(sourceId, {
    status: "free",
    waiter_id: null,
    opened_at: null,
  });
}

export async function listTableItems(tableId: string): Promise<TableItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("table_order_items")
    .select("*")
    .eq("table_id", tableId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    price: Number(r.price),
    qty: Number(r.qty),
  })) as TableItem[];
}

export async function addTableItem(input: {
  restaurant_id: string;
  table_id: string;
  name: string;
  qty: number;
  price: number;
  notes?: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("table_order_items").insert(input);
  if (error) throw error;
}

export async function removeTableItem(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("table_order_items").delete().eq("id", id);
  if (error) throw error;
}
