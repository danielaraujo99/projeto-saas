import { supabase } from "@/lib/custom-supabase";

export type Waiter = {
  id: string;
  restaurant_id: string;
  name: string;
  pin: string;
  photo_url: string | null;
  active: boolean;
  created_at: string;
};

export type WaiterStats = {
  waiter_id: string;
  open_tables: number;
  total_value: number;
  ticket_avg: number;
};

export async function listWaiters(restaurantId: string): Promise<Waiter[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("waiters")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Waiter[];
}

export async function createWaiter(input: {
  restaurant_id: string;
  name: string;
  pin: string;
  photo_url?: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("waiters").insert(input);
  if (error) throw error;
}

export async function updateWaiter(id: string, patch: Partial<Waiter>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("waiters").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteWaiter(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("waiters").delete().eq("id", id);
  if (error) throw error;
}

export async function getWaiterStats(restaurantId: string): Promise<Record<string, WaiterStats>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tables } = await (supabase as any)
    .from("tables")
    .select("id, waiter_id, status")
    .eq("restaurant_id", restaurantId)
    .eq("status", "occupied");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from("table_order_items")
    .select("table_id, qty, price")
    .eq("restaurant_id", restaurantId);

  const tableWaiter = new Map<string, string | null>();
  const openByWaiter = new Map<string, number>();
  for (const t of (tables ?? []) as Array<{ id: string; waiter_id: string | null }>) {
    tableWaiter.set(t.id, t.waiter_id);
    if (t.waiter_id) openByWaiter.set(t.waiter_id, (openByWaiter.get(t.waiter_id) ?? 0) + 1);
  }
  const totalByWaiter = new Map<string, number>();
  for (const it of (items ?? []) as Array<{ table_id: string; qty: number; price: number }>) {
    const w = tableWaiter.get(it.table_id);
    if (!w) continue;
    const v = Number(it.price) * Number(it.qty);
    totalByWaiter.set(w, (totalByWaiter.get(w) ?? 0) + v);
  }
  const out: Record<string, WaiterStats> = {};
  const ids = new Set([...openByWaiter.keys(), ...totalByWaiter.keys()]);
  for (const id of ids) {
    const open = openByWaiter.get(id) ?? 0;
    const total = totalByWaiter.get(id) ?? 0;
    out[id] = {
      waiter_id: id,
      open_tables: open,
      total_value: total,
      ticket_avg: open > 0 ? total / open : 0,
    };
  }
  return out;
}
