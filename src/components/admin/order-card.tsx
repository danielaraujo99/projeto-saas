import * as React from "react";
import { Clock, Wallet, Bike, ShoppingBag } from "lucide-react";
import type { OrderRow } from "@/lib/orders-api";
import { brl } from "@/lib/format";
import { StatusBadge } from "./status-badge";
import type { AdminOrderStatus } from "@/lib/admin/admin-orders";
import { cn } from "@/lib/utils";

function elapsedLabel(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}min`;
}

function paymentLabel(p: OrderRow["payment"]) {
  if (!p) return "—";
  if (p.kind === "pix") return "Pix";
  if (p.kind === "cash") return "Dinheiro";
  if (p.kind === "credit") return `Crédito ${("brand" in p && p.brand) || ""}`.trim();
  if (p.kind === "debit") return `Débito ${("brand" in p && p.brand) || ""}`.trim();
  return "—";
}

export function OrderCard({
  order,
  onClick,
  dragHandleProps,
  isDragging,
}: {
  order: OrderRow;
  onClick?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}) {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const t = setInterval(force, 30_000);
    return () => clearInterval(t);
  }, []);
  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const summary = order.items
    .slice(0, 2)
    .map((i) => `${i.quantity}× ${i.name}`)
    .join(" · ");
  return (
    <div
      onClick={onClick}
      {...dragHandleProps}
      className={cn(
        "cursor-pointer select-none rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md",
        isDragging && "rotate-1 opacity-70 shadow-lg",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          #{order.short_id}
        </span>
        <StatusBadge status={order.status as AdminOrderStatus} />
      </div>
      <div className="mb-1.5 text-sm font-semibold text-slate-900 line-clamp-2">
        {summary}
        {order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <ShoppingBag className="h-3 w-3" /> {itemsCount} {itemsCount === 1 ? "item" : "itens"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {elapsedLabel(order.created_at)}
        </span>
        <span className="inline-flex items-center gap-1">
          {order.pickup ? <ShoppingBag className="h-3 w-3" /> : <Bike className="h-3 w-3" />}
          {order.pickup ? "Retirada" : "Entrega"}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
          <Wallet className="h-3 w-3" /> {paymentLabel(order.payment)}
        </span>
        <span className="text-sm font-bold text-slate-900 tabular-nums">
          {brl(Number(order.total))}
        </span>
      </div>
    </div>
  );
}
