import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CreatePixResult = {
  id: number;
  qrCode: string; // copia e cola (EMV BR Code)
  status: string;
  ticketUrl: string;
  expiresAt: string; // ISO
};

export const createPixCharge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        amount: z.number().positive(),
        description: z.string().min(1).max(256),
        externalReference: z.string().min(1).max(64),
        payerEmail: z.string().email().optional(),
        expirationMinutes: z.number().int().min(1).max(60).default(5),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<CreatePixResult> => {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");

    // Mercado Pago cancela automaticamente Pix com expiração <= ~5 min.
    // Enviamos 30 min ao MP e retornamos um `expiresAt` separado para o timer visual.
    const mpExpiresAt = new Date(Date.now() + 30 * 60_000);
    const displayExpiresAt = new Date(Date.now() + data.expirationMinutes * 60_000);

    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${data.externalReference}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: Number(data.amount.toFixed(2)),
        description: data.description,
        payment_method_id: "pix",
        external_reference: data.externalReference,
        date_of_expiration: mpExpiresAt.toISOString().replace("Z", "-00:00"),
        payer: {
          email: data.payerEmail ?? "cliente@menualtas.com.br",
          first_name: "Cliente",
          last_name: "MenuAtlas",
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Mercado Pago (${res.status}): ${body}`);
    }
    const p = await res.json();
    return {
      id: p.id,
      qrCode: p.point_of_interaction?.transaction_data?.qr_code ?? "",
      status: p.status,
      ticketUrl: p.point_of_interaction?.transaction_data?.ticket_url ?? "",
      expiresAt: displayExpiresAt.toISOString(),
    };
  });

export const getPixStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ paymentId: z.number() }).parse(input))
  .handler(async ({ data }) => {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${data.paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Mercado Pago status (${res.status})`);
    const p = await res.json();
    return {
      status: p.status as string,
      statusDetail: (p.status_detail ?? null) as string | null,
    };
  });
