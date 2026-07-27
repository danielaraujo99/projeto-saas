import { supabase } from "@/lib/custom-supabase";
import { getDeviceId } from "@/lib/device-id";
import { computeStatus, type OrderStatus } from "@/lib/order-status";
import type { Address, CartItem, PaymentMethod } from "@/types";

export type OrderRow = {
  id: string;
  short_id: string;
  device_id: string;
  restaurant_id: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  address: Address | null;
  pickup: boolean;
  payment: PaymentMethod;
  eta_minutes: number;
  status: OrderStatus;
  payment_confirmed_at: string | null;
  rated: boolean;
  rating_food: number | null;
  rating_delivery: number | null;
  rating_comment: string | null;
  created_at: string;
  updated_at: string;
};

function shortId() {
  return "PED" + Math.floor(100000 + Math.random() * 900000);
}

/** Parse a DB row (jsonb columns arrive typed as unknown) into our OrderRow shape. */
function parseRow(row: Record<string, unknown>): OrderRow {
  return {
    ...row,
    items: (row.items ?? []) as CartItem[],
    address: (row.address ?? null) as Address | null,
    payment: row.payment as PaymentMethod,
    subtotal: Number(row.subtotal),
    delivery_fee: Number(row.delivery_fee),
    discount: Number(row.discount),
    total: Number(row.total),
  } as OrderRow;
}

/** Compute the current status from elapsed time and persist it if it changed. */
async function reconcileStatus(row: OrderRow): Promise<OrderRow> {
  if (!row.payment_confirmed_at) return row;
  if (row.status === "delivered") return row;
  const expected = computeStatus(row.payment_confirmed_at);
  if (expected === row.status) return row;
  await supabase.from("orders").update({ status: expected }).eq("id", row.id);
  return { ...row, status: expected };
}

export type CreateOrderInput = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  address?: Address;
  pickup: boolean;
  payment: PaymentMethod;
  etaMinutes: number;
  restaurantId: string;
};

export async function createOrder(input: CreateOrderInput): Promise<OrderRow> {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      short_id: shortId(),
      device_id: deviceId,
      restaurant_id: input.restaurantId,
      items: input.items,
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      discount: input.discount,
      total: input.total,
      coupon_code: input.couponCode ?? null,
      address: input.address ?? null,
      pickup: input.pickup,
      payment: input.payment,
      eta_minutes: input.etaMinutes,
      status: "pending_payment",
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar pedido");
  return parseRow(data as Record<string, unknown>);
}

export async function confirmPayment(id: string): Promise<OrderRow> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "received", payment_confirmed_at: now })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) throw error ?? new Error("Falha ao confirmar pagamento");
  return parseRow(data as Record<string, unknown>);
}

export async function getOrderById(id: string): Promise<OrderRow | null> {
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return reconcileStatus(parseRow(data as Record<string, unknown>));
}

export async function listMyOrders(): Promise<OrderRow[]> {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const parsed = (data ?? []).map((r) => parseRow(r as Record<string, unknown>));
  return Promise.all(parsed.map(reconcileStatus));
}

export async function rateOrder(
  id: string,
  ratings: { food: number; delivery: number; comment?: string },
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      rated: true,
      rating_food: ratings.food,
      rating_delivery: ratings.delivery,
      rating_comment: ratings.comment ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}
