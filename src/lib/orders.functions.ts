import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createOrderRecord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        deviceId: z.string().min(1).max(160),
        restaurantId: z.string().uuid().optional(),
        restaurantSlug: z.string().min(1).max(120).optional(),
        items: z.array(z.unknown()).min(1),
        subtotal: z.number().nonnegative(),
        deliveryFee: z.number().nonnegative(),
        discount: z.number().nonnegative(),
        total: z.number().nonnegative(),
        couponCode: z.string().optional(),
        address: z.unknown().optional(),
        pickup: z.boolean(),
        payment: z.unknown(),
        etaMinutes: z.number().int().positive().max(240),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const customUrl = process.env.CUSTOM_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceKey =
      process.env.CUSTOM_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!customUrl || !serviceKey) throw new Error("Backend custom não configurado.");

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(customUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (serviceKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${serviceKey}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", serviceKey);
          return fetch(input, { ...init, headers });
        },
      },
    });

    let restaurantId = data.restaurantId ?? null;
    if (restaurantId) {
      const { data: restaurant } = await admin
        .from("restaurants")
        .select("id")
        .eq("id", restaurantId)
        .maybeSingle();
      restaurantId = restaurant?.id ?? null;
    }

    if (!restaurantId && data.restaurantSlug) {
      const { data: restaurant, error } = await admin
        .from("restaurants")
        .select("id")
        .eq("slug", data.restaurantSlug)
        .maybeSingle();
      if (error) throw error;
      restaurantId = restaurant?.id ?? null;
    }

    if (!restaurantId) throw new Error("Restaurante não encontrado para criar o pedido.");

    const shortId = "PED" + Math.floor(100000 + Math.random() * 900000);
    const { data: order, error } = await admin
      .from("orders")
      .insert({
        short_id: shortId,
        device_id: data.deviceId,
        restaurant_id: restaurantId,
        items: data.items,
        subtotal: data.subtotal,
        delivery_fee: data.deliveryFee,
        discount: data.discount,
        total: data.total,
        coupon_code: data.couponCode ?? null,
        address: data.address ?? null,
        pickup: data.pickup,
        payment: data.payment,
        eta_minutes: data.etaMinutes,
        status: "pending_payment",
      })
      .select()
      .single();

    if (error) throw error;
    if (!order) throw new Error("Falha ao criar pedido.");
    return order;
  });

export const confirmOrderPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const customUrl = process.env.CUSTOM_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceKey =
      process.env.CUSTOM_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!customUrl || !serviceKey) throw new Error("Backend custom não configurado.");

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(customUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (serviceKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${serviceKey}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", serviceKey);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const now = new Date().toISOString();
    const { data: order, error } = await admin
      .from("orders")
      .update({ status: "received", payment_confirmed_at: now })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;
    if (!order) throw new Error("Falha ao confirmar pagamento.");
    return order;
  });