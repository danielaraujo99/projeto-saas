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
  const { data } = await (supabase as any)
    .from("restaurants")
    .select("name, logo_url, settings")
    .eq("id", restaurantId)
    .maybeSingle();
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
  const { data } = await supa
    .from("restaurants")
    .select("settings")
    .eq("id", restaurantId)
    .maybeSingle();
  const settings = { ...(data?.settings ?? {}), print: { ...(data?.settings?.print ?? {}), ...patch } };
  const { error } = await supa.from("restaurants").update({ settings }).eq("id", restaurantId);
  if (error) throw error;
}

function fontPx(f: PrintSettings["font"]) {
  return f === "small" ? 11 : f === "large" ? 15 : 13;
}
function widthMm(p: PrintSettings["paper"]) {
  return p === "58mm" ? "58mm" : "80mm";
}

type ReceiptVariant = "kitchen" | "delivery";

export function buildReceiptHtml(opts: {
  order: {
    short_id: string;
    items: Array<{ name: string; qty: number; price: number; addOns?: Array<{ name: string; price?: number }>; notes?: string | null }>;
    total: number;
    subtotal?: number;
    delivery_fee?: number;
    payment?: string;
    address?: { street?: string; number?: string; district?: string; recipient?: string } | null;
    pickup?: boolean;
  };
  variant: ReceiptVariant;
  settings: PrintSettings;
}): string {
  const { order, variant, settings } = opts;
  const showPrices = variant === "delivery" || settings.show_prices_kitchen;
  const w = widthMm(settings.paper);
  const fs = fontPx(settings.font);
  const typeLabel = order.pickup ? "RETIRADA" : "ENTREGA";
  const tag = variant === "kitchen" ? "VIA COZINHA" : "VIA " + typeLabel;

  const itemsHtml = order.items
    .map((it) => {
      const line = `<div class="row"><span>${it.qty}× ${escape(it.name)}</span>${
        showPrices ? `<span>${brl(it.qty * it.price)}</span>` : ""
      }</div>`;
      const extras = (it.addOns ?? [])
        .map(
          (a) =>
            `<div class="sub">+ ${escape(a.name)}${
              showPrices && a.price ? ` (${brl(a.price)})` : ""
            }</div>`,
        )
        .join("");
      const notes = it.notes ? `<div class="sub note">Obs: ${escape(it.notes)}</div>` : "";
      return line + extras + notes;
    })
    .join("");

  const totalsHtml = showPrices
    ? `<div class="line"></div>
       ${
         order.subtotal != null
           ? `<div class="row"><span>Subtotal</span><span>${brl(order.subtotal)}</span></div>`
           : ""
       }
       ${
         order.delivery_fee
           ? `<div class="row"><span>Entrega</span><span>${brl(order.delivery_fee)}</span></div>`
           : ""
       }
       <div class="row total"><span>TOTAL</span><span>${brl(order.total)}</span></div>
       ${order.payment ? `<div class="row"><span>Pagamento</span><span>${escape(order.payment)}</span></div>` : ""}`
    : "";

  const addr =
    variant === "delivery" && order.address && !order.pickup
      ? `<div class="line"></div>
         <div class="sub"><b>${escape(order.address.recipient ?? "Cliente")}</b></div>
         <div class="sub">${escape(order.address.street ?? "")}, ${escape(order.address.number ?? "")}</div>
         <div class="sub">${escape(order.address.district ?? "")}</div>`
      : "";

  const qr =
    variant === "delivery" && settings.show_qr
      ? `<div class="qr">
           <img alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
             "PED:" + order.short_id,
           )}" />
           <div class="sub">Acompanhe seu pedido</div>
         </div>`
      : "";

  const logo =
    settings.show_logo && settings.logo_url
      ? `<img class="logo" src="${escape(settings.logo_url)}" alt="logo" />`
      : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(
    settings.restaurant_name ?? "Comanda",
  )} - ${escape(order.short_id)}</title>
    <style>
      @page { size: ${w} auto; margin: 4mm; }
      * { box-sizing: border-box; }
      body { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: ${fs}px; color: #000; margin: 0; padding: 4px; }
      .center { text-align: center; }
      .logo { max-width: 60%; max-height: 60px; margin: 0 auto 4px; display: block; }
      .tag { border: 1px dashed #000; padding: 2px 6px; display: inline-block; margin: 4px 0; font-weight: 900; letter-spacing: 1px; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      .row { display: flex; justify-content: space-between; gap: 8px; }
      .total { font-weight: 900; font-size: ${fs + 2}px; margin-top: 4px; }
      .sub { font-size: ${fs - 1}px; padding-left: 8px; }
      .note { font-weight: 700; }
      .qr { text-align: center; margin-top: 6px; }
      .qr img { display: inline-block; }
      h1 { font-size: ${fs + 2}px; margin: 0; }
    </style></head><body>
    <div class="center">
      ${logo}
      <h1>${escape(settings.restaurant_name ?? "MenuAltas")}</h1>
      <div class="tag">${tag}</div>
      <div>Pedido #${escape(order.short_id)}</div>
    </div>
    <div class="line"></div>
    ${itemsHtml}
    ${totalsHtml}
    ${addr}
    ${qr}
    <div class="line"></div>
    <div class="center sub">${new Date().toLocaleString("pt-BR")}</div>
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
  // Abre janela dedicada; navegadores mostram diálogo de confirmação nativo.
  // Para impressão 100% silenciosa, ver aviso do agente local.
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
      name: i.product.name,
      qty: i.quantity,
      price: i.unitPrice,
      addOns: i.addOns ?? [],
      notes: i.notes ?? null,
    })),
    total: order.total,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    payment: order.payment?.method,
    address: order.address,
    pickup: order.pickup,
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
