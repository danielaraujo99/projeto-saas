import * as React from "react";
import type { OrderRow } from "@/lib/orders-api";
import { Button } from "@/components/ui/button";
import { updateOrderStatus, type AdminOrderStatus } from "@/lib/admin/admin-orders";
import { Clock, Bike, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function minutesSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export function KdsCard({ order, onDone }: { order: OrderRow; onDone: () => void }) {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const t = setInterval(force, 15_000);
    return () => clearInterval(t);
  }, []);
  const mins = minutesSince(order.created_at);
  const tone =
    mins >= 25
      ? "border-rose-500 bg-rose-950/40"
      : mins >= 15
        ? "border-amber-400 bg-amber-950/30"
        : "border-slate-700 bg-slate-900";

  const [busy, setBusy] = React.useState(false);
  async function markReady() {
    setBusy(true);
    try {
      await updateOrderStatus(order.id, "delivering");
      toast.success("Marcado como pronto");
      onDone();
    } catch {
      toast.error("Falha ao marcar como pronto.");
      setBusy(false);
    }
  }

  const started = order.status === "preparing";

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border-2 p-4 text-slate-100 shadow-lg",
        tone,
      )}
    >
      <header className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pedido
          </div>
          <div className="text-2xl font-black tabular-nums text-white">
            #{order.short_id}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums",
            mins >= 25
              ? "bg-rose-500 text-white"
              : mins >= 15
                ? "bg-amber-400 text-slate-900"
                : "bg-slate-800 text-slate-100",
          )}
        >
          <Clock className="h-4 w-4" /> {mins} min
        </div>
      </header>

      <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-800/80 px-2.5 py-1 text-xs">
        {order.pickup ? <ShoppingBag className="h-3 w-3" /> : <Bike className="h-3 w-3" />}
        {order.pickup ? "Retirada no balcão" : "Entrega em domicílio"}
      </div>

      <ul className="flex-1 space-y-2">
        {order.items.map((it, i) => (
          <li key={i} className="rounded-lg bg-slate-950/40 p-3">
            <div className="flex items-baseline gap-2">
              <span className="rounded-md bg-amber-400 px-2 py-0.5 text-sm font-black text-slate-900 tabular-nums">
                {it.quantity}×
              </span>
              <span className="text-lg font-bold text-white">{it.name}</span>
            </div>
            {it.customizations.length ? (
              <ul className="mt-1 space-y-0.5 pl-8 text-sm text-slate-300">
                {it.customizations.map((c, j) => (
                  <li key={j}>+ {c.optionName}</li>
                ))}
              </ul>
            ) : null}
            {it.note ? (
              <div className="mt-1 pl-8 text-sm italic text-amber-300">
                Obs: {it.note}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2">
        {!started ? (
          <Button
            className="h-12 flex-1 bg-slate-100 text-base font-bold text-slate-900 hover:bg-white"
            onClick={async () => {
              setBusy(true);
              try {
                await updateOrderStatus(order.id, "preparing");
                toast.success("Preparo iniciado");
                onDone();
              } catch {
                toast.error("Falha ao iniciar preparo.");
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            Iniciar preparo
          </Button>
        ) : null}
        <Button
          className="h-12 flex-1 bg-emerald-500 text-base font-bold text-slate-900 hover:bg-emerald-400"
          onClick={markReady}
          disabled={busy}
        >
          <Check className="h-5 w-5" /> Pronto
        </Button>
      </div>
    </article>
  );
}

// helper used by KDS pages to compute a color class from status
export function statusToneKds(status: AdminOrderStatus) {
  return status;
}
