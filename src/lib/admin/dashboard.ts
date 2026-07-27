import { supabase } from "@/lib/custom-supabase";
import type { OrderRow } from "@/lib/orders-api";

export type DashboardStats = {
  revenue: number;
  orders: number;
  ticket: number;
  prepTimeMin: number;
  revenue7d: Array<{ date: string; value: number }>;
  heatmap: number[][]; // rows: 5 slots (00,06,12,18,23) x cols: 7 days
  topProducts: Array<{ name: string; sales: number }>;
  paymentMethods: Array<{ name: string; value: number; pct: number }>;
};

const EMPTY: DashboardStats = {
  revenue: 0,
  orders: 0,
  ticket: 0,
  prepTimeMin: 0,
  revenue7d: [],
  heatmap: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  topProducts: [],
  paymentMethods: [],
};

function payLabel(m: string): string {
  switch (m) {
    case "pix": return "PIX";
    case "credit": return "Cartão crédito";
    case "debit": return "Cartão débito";
    case "cash": return "Dinheiro";
    default: return m || "Outros";
  }
}

export async function getDashboardStats(restaurantId: string): Promise<DashboardStats> {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("orders")
    .select("total,items,payment,status,created_at,payment_confirmed_at,status_updated_at")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[dashboard] stats:", error.message);
    return EMPTY;
  }
  const rows = (data ?? []) as unknown as OrderRow[];
  if (rows.length === 0) return EMPTY;

  const paid = rows.filter((r) => r.status !== "pending_payment" && r.status !== "canceled");
  const revenue = paid.reduce((a, r) => a + Number(r.total || 0), 0);
  const ordersCount = paid.length;
  const ticket = ordersCount ? revenue / ordersCount : 0;

  // 7-day revenue series
  const byDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, 0);
  }
  for (const r of paid) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) || 0) + Number(r.total || 0));
  }
  const revenue7d = Array.from(byDay.entries()).map(([k, v]) => {
    const d = new Date(k);
    return { date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, value: v };
  });

  // Heatmap: rows are hour buckets (0-5,6-11,12-17,18-22,23), cols are day of week (Mon..Sun)
  const buckets: number[][] = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ];
  for (const r of paid) {
    const d = new Date(r.created_at);
    const hour = d.getHours();
    const dayJs = d.getDay(); // 0 Sun .. 6 Sat
    const col = (dayJs + 6) % 7; // Mon=0..Sun=6
    let row = 0;
    if (hour >= 6 && hour < 12) row = 1;
    else if (hour >= 12 && hour < 18) row = 2;
    else if (hour >= 18 && hour < 23) row = 3;
    else if (hour === 23) row = 4;
    buckets[row][col] += 1;
  }
  const max = Math.max(1, ...buckets.flat());
  const heatmap = buckets.map((row) => row.map((v) => v / max));

  // Top products
  const prodMap = new Map<string, number>();
  for (const r of paid) {
    const items = (r.items ?? []) as Array<{ name?: string; qty?: number }>;
    for (const it of items) {
      const name = it?.name ?? "";
      if (!name) continue;
      prodMap.set(name, (prodMap.get(name) || 0) + Number(it.qty || 1));
    }
  }
  const topProducts = Array.from(prodMap.entries())
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Payment methods
  const payMap = new Map<string, number>();
  for (const r of paid) {
    const p = r.payment as { method?: string } | null;
    const label = payLabel(p?.method ?? "");
    payMap.set(label, (payMap.get(label) || 0) + Number(r.total || 0));
  }
  const payTotal = Array.from(payMap.values()).reduce((a, b) => a + b, 0) || 1;
  const paymentMethods = Array.from(payMap.entries())
    .map(([name, value]) => ({ name, value, pct: Math.round((value / payTotal) * 100) }))
    .sort((a, b) => b.value - a.value);

  // Avg preparation time (received/confirmed -> delivering) approximation: use created_at -> status_updated_at when delivered/concluded
  const deliveredRows = rows.filter((r) => r.status === "delivered" || r.status === "concluded");
  const prepMs = deliveredRows.reduce(
    (a, r) => a + (new Date(r.status_updated_at).getTime() - new Date(r.created_at).getTime()),
    0,
  );
  const prepTimeMin = deliveredRows.length ? Math.round(prepMs / deliveredRows.length / 60000) : 0;

  return { revenue, orders: ordersCount, ticket, prepTimeMin, revenue7d, heatmap, topProducts, paymentMethods };
}
