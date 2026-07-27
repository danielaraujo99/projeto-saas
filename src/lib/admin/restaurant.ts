import { supabase } from "@/lib/custom-supabase";

export type OperationSettings = {
  hours?: Array<{ day: string; open: boolean; from: string; to: string }>;
  auto_close?: boolean;
  prep_time_min?: number;
  delivery_time_min?: number;
  delivery_radius_km?: number;
  delivery_fee?: number;
  min_order?: number;
  accept_pickup?: boolean;
};

export type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  description: string | null;
  address: string | null;
  category: string | null;
  logo_url: string | null;
  cover_url: string | null;
  settings: OperationSettings | null;
  active: boolean;
};

export async function getRestaurant(id: string): Promise<RestaurantRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("restaurants")
    .select("id,name,slug,phone,description,address,category,logo_url,cover_url,settings,active")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.warn("[restaurant] fetch:", error.message);
    return null;
  }
  return (data ?? null) as RestaurantRow | null;
}

export async function updateRestaurantInfo(
  id: string,
  patch: Partial<Pick<RestaurantRow, "name" | "slug" | "phone" | "description" | "address" | "category" | "logo_url" | "cover_url">>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("restaurants").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateRestaurantSettings(id: string, settings: OperationSettings) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("restaurants").update({ settings }).eq("id", id);
  if (error) throw error;
}
