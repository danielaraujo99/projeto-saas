import { supabase } from "@/lib/custom-supabase";
import type { OrderRow } from "@/lib/orders-api";
import { brl } from "@/lib/format";

export type PrintSettings = {
  enabled: boolean;
  kitchen: boolean;
  delivery: boolean;
  show_logo: boolean;
  show_qr: boolean;
  show_prices_kitchen: boolean;
  paper: "58mm" | "80mm";
  font: "small" | "medium" | "large";
  restaurant_name?: string;
  logo_url?: string | null;
};

export const DEFAULT_PRINT: PrintSettings = {
  enabled: false,
  kitchen: true,
  delivery: true,
  show_logo: true,
  show_qr: true,
  show_prices_kitchen: false,
  paper: "80mm",
  font: "medium",
};

export async function loadPrintSettings(restaurantId: string): Promise<PrintSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("restaurants")
    .select("name, logo_url, settings")
    .eq("id", restaurantId)
    .maybeSingle();
  if (error) throw error;
  const s = (data?.settings?.print ?? {}) as Partial<PrintSettings>;
  return {
    ...DEFAULT_PRINT,
    ...s,
    restaurant_name: data?.name,
    logo_url: data?.logo_url ?? null,
  };
}

export async function savePrintSettings(restaurantId: string, patch: Partial<PrintSettings>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = supabase as any;
  const { data, error: readErr } = await supa
    .from("restaurants")
    .select("settings")
    .eq("id", restaurantId)
    .maybeSingle();
  if (readErr) throw readErr;
  const settings = {
    ...(data?.settings ?? {}),
    print: { ...(data?.settings?.print ?? {}), ...patch },
  };
  const { error } = await supa.from("restaurants").update({ settings }).eq("id", restaurantId);
  if (error) throw error;
}

function fontPx(f: PrintSettings["font"]) {
  return f === "small" ? 11 : f === "large" ? 15 : 13;
}
function widthMm(p: PrintSettings["paper"]) {
  return p === "58mm" ? "58mm" : "80mm";
}

const PAY_LABEL: Record<string, string> = {
  pix: "PIX",
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  cash: "Dinheiro",
  card: "Cartão",
};

type ReceiptVariant = "kitchen" | "delivery";

export function buildReceiptHtml(opts: {
  order: {
    short_id: string;
    items: Array<{
      name: string;
      qty: number;
      price: number;
      addOns?: Array<{ name: string; price?: number }>;
      notes?: string | null;
    }>;
    total: number;
    subtotal?: number;
    delivery_fee?: number;
    discount?: number;
    payment?: string;
    customer_name?: string;
    customer_phone?: string;
    address?: {
      street?: string;
      number?: string;
      district?: string;
      complement?: string;
      recipient?: string;
    } | null;
    pickup?: boolean;
    created_at?: string;
  };
  variant: ReceiptVariant;
  settings: PrintSettings;
}): string {
  const { order, variant, settings } = opts;
  const showPrices = variant === "delivery" || settings.show_prices_kitchen;
  const w = widthMm(settings.paper);
  const fs = fontPx(settings.font);
  const typeLabel = order.pickup ? "RETIRADA" : "ENTREGA";
  const tag = variant === "kitchen" ? "COZINHA" : typeLabel;

  const itemsHtml = order.items
    .map((it, idx) => {
      const number = `<span class="idx">${String(idx + 1).padStart(2, "0")}</span>`;
      const qty = `<span class="qty">${it.qty}x</span>`;
      const name = `<span class="name">${escape(it.name)}</span>`;
      const price = showPrices
        ? `<span class="price">${brl(it.qty * it.price)}</span>`
        : "";
      const head = `<div class="item"><div class="head">${number}${qty}${name}${price}</div>`;
      const extras = (it.addOns ?? [])
        .map(
          (a) =>
            `<div class="sub">+ ${escape(a.name)}${
              showPrices && a.price ? ` <span class="ex-price">${brl(a.price)}</span>` : ""
            }</div>`,
        )
        .join("");
      const notes = it.notes ? `<div class="note">Obs: ${escape(it.notes)}</div>` : "";
      return `${head}${extras}${notes}</div>`;
    })
    .join("");

  const payLabel = order.payment ? PAY_LABEL[order.payment] ?? order.payment.toUpperCase() : "";

  const totalsHtml = showPrices
    ? `<div class="hr"></div>
       <div class="tot">
         ${order.subtotal != null ? `<div class="row"><span>Subtotal</span><span>${brl(order.subtotal)}</span></div>` : ""}
         ${order.delivery_fee ? `<div class="row"><span>Entrega</span><span>${brl(order.delivery_fee)}</span></div>` : ""}
         ${order.discount ? `<div class="row"><span>Desconto</span><span>-${brl(order.discount)}</span></div>` : ""}
         <div class="row grand"><span>TOTAL</span><span>${brl(order.total)}</span></div>
         ${payLabel ? `<div class="row pay"><span>Pagamento</span><span>${escape(payLabel)}</span></div>` : ""}
       </div>`
    : "";

  const customerBlock =
    variant === "delivery" && (order.customer_name || order.address?.recipient || order.customer_phone)
      ? `<div class="hr"></div>
         <div class="sec-title">CLIENTE</div>
         <div class="sub bold">${escape(order.customer_name ?? order.address?.recipient ?? "Cliente")}</div>
         ${order.customer_phone ? `<div class="sub">Tel: ${escape(order.customer_phone)}</div>` : ""}`
      : "";

  const addr =
    variant === "delivery" && order.address && !order.pickup
      ? `<div class="hr"></div>
         <div class="sec-title">ENDERECO DE ENTREGA</div>
         <div class="sub">${escape(order.address.street ?? "")}, ${escape(order.address.number ?? "")}</div>
         ${order.address.complement ? `<div class="sub">${escape(order.address.complement)}</div>` : ""}
         <div class="sub">${escape(order.address.district ?? "")}</div>`
      : "";

  const pickupBox =
    variant === "delivery" && order.pickup
      ? `<div class="hr"></div>
         <div class="sec-title">RETIRADA NO LOCAL</div>
         <div class="sub">O cliente ira buscar este pedido.</div>`
      : "";

  const qr =
    variant === "delivery" && settings.show_qr
      ? `<div class="qr">
           <img alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${encodeURIComponent("PED:" + order.short_id)}" />
           <div class="sub small">Acompanhe seu pedido</div>
           <div class="sub small mono">#${escape(order.short_id)}</div>
         </div>`
      : "";

  const logo =
    settings.show_logo && settings.logo_url
      ? `<img class="logo" src="${escape(settings.logo_url)}" alt="logo" />`
      : "";

  const now = order.created_at ? new Date(order.created_at) : new Date();

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(
    settings.restaurant_name ?? "Comanda",
  )} - ${escape(order.short_id)}</title>
    <style>
      @page { size: ${w} auto; margin: 3mm; }
      * { box-sizing: border-box; }
      body { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: ${fs}px; color: #000; margin: 0; padding: 2px; line-height: 1.4; }
      .center { text-align: center; }
      .logo { max-width: 55%; max-height: 55px; margin: 0 auto 4px; display: block; }
      h1 { font-size: ${fs + 3}px; margin: 0; letter-spacing: 0.5px; font-weight: 900; }
      .tag { display: inline-block; margin: 6px 0 2px; padding: 4px 12px; border: 1.5px solid #000; border-radius: 2px; font-weight: 900; font-size: ${fs + 1}px; letter-spacing: 2px; }
      .oid { font-size: ${fs + 4}px; font-weight: 900; margin-top: 4px; letter-spacing: 1px; }
      .time { font-size: ${fs - 1}px; color: #444; margin-top: 2px; }
      .hr { border-top: 1.5px dashed #000; margin: 7px 0; }
      .sec-title { font-size: ${fs - 1}px; font-weight: 900; letter-spacing: 1.5px; margin-bottom: 4px; color: #000; }
      .item { margin-bottom: 6px; page-break-inside: avoid; }
      .head { display: flex; align-items: flex-start; gap: 6px; font-weight: 700; }
      .idx { display: inline-block; min-width: 22px; color: #555; font-weight: 600; font-variant-numeric: tabular-nums; }
      .qty { min-width: 30px; font-weight: 900; font-variant-numeric: tabular-nums; }
      .name { flex: 1; }
      .price { font-weight: 900; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .sub { padding-left: 28px; font-size: ${fs - 1}px; color: #222; margin-top: 1px; }
      .sub.bold { font-weight: 700; color: #000; }
      .sub.small { font-size: ${fs - 2}px; padding: 0; }
      .sub.mono { font-family: ui-monospace, monospace; letter-spacing: 1px; }
      .ex-price { color: #555; font-size: ${fs - 2}px; }
      .note { margin-top: 3px; margin-left: 28px; padding: 3px 6px; background: #f2f2f2; border-left: 3px solid #000; font-weight: 700; font-size: ${fs - 1}px; }
      .row { display: flex; justify-content: space-between; gap: 8px; padding: 1px 0; font-variant-numeric: tabular-nums; }
      .tot .row { font-size: ${fs}px; }
      .grand { font-weight: 900; font-size: ${fs + 3}px; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
      .pay { color: #000; font-weight: 700; margin-top: 3px; }
      .qr { text-align: center; margin-top: 8px; }
      .qr img { display: inline-block; }
      .foot { text-align: center; font-size: ${fs - 2}px; margin-top: 8px; color: #555; letter-spacing: 0.5px; }
    </style></head><body>
    <div class="center">
      ${logo}
      <h1>${escape(settings.restaurant_name ?? "MenuAltas")}</h1>
      <div class="tag">VIA ${tag}</div>
      <div class="oid">#${escape(order.short_id)}</div>
      <div class="time">${now.toLocaleString("pt-BR")}</div>
    </div>
    <div class="hr"></div>
    <div class="sec-title">ITENS (${order.items.reduce((s, i) => s + i.qty, 0)})</div>
    ${itemsHtml}
    ${totalsHtml}
    ${customerBlock}
    ${addr}
    ${pickupBox}
    ${qr}
    <div class="hr"></div>
    <div class="foot">MenuAltas &middot; ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
  </body></html>`;
}

export function buildTableCheckHtml(opts: {
  title: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  settings: PrintSettings;
}): string {
  return buildReceiptHtml({
    order: {
      short_id: opts.title,
      items: opts.items,
      total: opts.total,
      subtotal: opts.total,
      pickup: true,
    },
    variant: "delivery",
    settings: opts.settings,
  });
}

export function printHtml(html: string) {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}

export function printOrder(order: OrderRow, settings: PrintSettings) {
  if (!settings.enabled) return;
  const shared = {
    short_id: order.short_id,
    items: order.items.map((i) => ({
      name: i.name,
      qty: i.quantity,
      price: i.unitPrice,
      addOns: (i.customizations ?? []).map((c) => ({ name: c.optionName, price: c.priceDelta })),
      notes: i.note ?? null,
    })),
    total: order.total,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    discount: order.discount,
    payment: order.payment?.kind,
    customer_name: order.address?.label,
    address: order.address
      ? {
          street: order.address.street,
          number: order.address.number,
          district: order.address.neighborhood,
          complement: order.address.complement,
          recipient: order.address.label,
        }
      : null,
    pickup: order.pickup,
    created_at: order.created_at,
  };
  if (settings.kitchen) printHtml(buildReceiptHtml({ order: shared, variant: "kitchen", settings }));
  if (settings.delivery) printHtml(buildReceiptHtml({ order: shared, variant: "delivery", settings }));
}

function escape(s: string | undefined | null): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
