import { supabase } from "@/lib/custom-supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const sb = supabase as any;

export type CouponRow = {
  id: string;
  restaurant_id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  description: string | null;
  created_at: string;
};

export async function listCoupons(restaurantId: string): Promise<CouponRow[]> {
  const { data, error } = await sb
    .from("coupons")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map((c) => ({
    ...c,
    value: Number(c.value),
    min_order: Number(c.min_order),
  })) as CouponRow[];
}

export async function createCoupon(input: {
  restaurant_id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  min_order?: number;
  max_uses?: number | null;
  expires_at?: string | null;
  description?: string | null;
  active?: boolean;
}) {
  const { error } = await sb.from("coupons").insert({
    ...input,
    code: input.code.toUpperCase(),
  });
  if (error) throw error;
}

export async function updateCoupon(id: string, patch: Partial<CouponRow>) {
  const { error } = await sb.from("coupons").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCoupon(id: string) {
  const { error } = await sb.from("coupons").delete().eq("id", id);
  if (error) throw error;
}
