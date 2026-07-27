import { supabase } from "@/lib/custom-supabase";

export type MpConfig = {
  restaurant_id: string;
  access_token: string;
  public_key: string;
  device_id: string | null;
  sandbox: boolean;
  enabled: boolean;
  updated_at?: string;
};

const TABLE = "restaurant_integrations";

export async function getMpConfig(restaurantId: string): Promise<MpConfig | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("provider", "mercadopago")
    .maybeSingle();
  if (error) {
    // Tabela pode não existir ainda — retorna null silenciosamente.
    console.warn("[MP] getMpConfig:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    restaurant_id: data.restaurant_id,
    access_token: data.access_token ?? "",
    public_key: data.public_key ?? "",
    device_id: data.device_id ?? null,
    sandbox: !!data.sandbox,
    enabled: !!data.enabled,
    updated_at: data.updated_at,
  };
}

export async function saveMpConfig(cfg: Omit<MpConfig, "updated_at">) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from(TABLE).upsert(
    {
      restaurant_id: cfg.restaurant_id,
      provider: "mercadopago",
      access_token: cfg.access_token,
      public_key: cfg.public_key,
      device_id: cfg.device_id,
      sandbox: cfg.sandbox,
      enabled: cfg.enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "restaurant_id,provider" },
  );
  if (error) throw error;
}

const MP_BASE = "https://api.mercadopago.com";

export type PixCharge = {
  id: number;
  qr_code: string;
  qr_code_base64: string;
  status: string;
  ticket_url: string;
};

export async function createPixCharge(
  cfg: MpConfig,
  input: { amount: number; description: string; externalReference?: string },
): Promise<PixCharge> {
  const res = await fetch(`${MP_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.access_token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${input.externalReference ?? "pdv"}-${Date.now()}`,
    },
    body: JSON.stringify({
      transaction_amount: Number(input.amount.toFixed(2)),
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.externalReference,
      payer: { email: "pdv@menualtas.local", first_name: "Cliente", last_name: "PDV" },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mercado Pago: ${res.status} ${body}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    qr_code: data.point_of_interaction?.transaction_data?.qr_code ?? "",
    qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64 ?? "",
    status: data.status,
    ticket_url: data.point_of_interaction?.transaction_data?.ticket_url ?? "",
  };
}

export async function getPaymentStatus(cfg: MpConfig, paymentId: number) {
  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${cfg.access_token}` },
  });
  if (!res.ok) throw new Error(`MP status ${res.status}`);
  const data = await res.json();
  return { status: data.status as string, status_detail: data.status_detail as string };
}

/**
 * Point (maquininha) — cria uma intenção de pagamento em um device específico.
 * Requer device_id (ex.: "PAX_A910__SMARTPOS12345678").
 */
export async function createPointPaymentIntent(
  cfg: MpConfig,
  input: { amount: number; type: "credit_card" | "debit_card"; description: string },
): Promise<{ id: string; device_id: string }> {
  if (!cfg.device_id) throw new Error("Maquininha não configurada (device_id).");
  const res = await fetch(
    `${MP_BASE}/point/integration-api/devices/${cfg.device_id}/payment-intents`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(input.amount * 100),
        description: input.description,
        payment: {
          type: input.type === "debit_card" ? "debit_card" : "credit_card",
          installments: 1,
          installments_cost: "seller",
        },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Point: ${res.status} ${body}`);
  }
  const data = await res.json();
  return { id: data.id, device_id: data.device_id };
}

export async function getPointIntentStatus(cfg: MpConfig, intentId: string) {
  const res = await fetch(`${MP_BASE}/point/integration-api/payment-intents/${intentId}`, {
    headers: { Authorization: `Bearer ${cfg.access_token}` },
  });
  if (!res.ok) throw new Error(`Point status ${res.status}`);
  return res.json();
}
