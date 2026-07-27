import { supabase } from "@/lib/custom-supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
const sb = supabase as any;

export type Category = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

export type Product = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
};

export async function listCategories(restaurantId: string): Promise<Category[]> {
  const { data, error } = await sb
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(input: {
  restaurant_id: string;
  name: string;
  sort_order?: number;
}) {
  const { error } = await sb.from("categories").insert(input);
  if (error) throw error;
}

export async function updateCategory(id: string, patch: Partial<Category>) {
  const { error } = await sb.from("categories").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function listProducts(restaurantId: string): Promise<Product[]> {
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as any[]).map((p) => ({ ...p, price: Number(p.price) })) as Product[];
}

export async function createProduct(input: {
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  active?: boolean;
  featured?: boolean;
}) {
  const { error } = await sb.from("products").insert(input);
  if (error) throw error;
}

export async function updateProduct(id: string, patch: Partial<Product>) {
  const { error } = await sb.from("products").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw error;
}
