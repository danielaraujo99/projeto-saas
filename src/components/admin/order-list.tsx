import * as React from "react";
import type { OrderRow } from "@/lib/orders-api";
import {
  KANBAN_COLUMNS,
  NEXT_STATUS,
  STATUS_LABEL,
  updateOrderStatus,
  type AdminOrderStatus,
} from "@/lib/admin/admin-orders";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { brl } from "@/lib/format";
import { Bike, ChevronDown, ShoppingBag, MoreHorizontal, Eye } from "lucide-react";
import { toast } from "sonner";

function elapsed(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

export function OrderList({
  orders,
  onOrderClick,
  onChanged,
}: {
  orders: OrderRow[];
  onOrderClick: (o: OrderRow) => void;
  onChanged: () => void;
}) {
  async function move(id: string, to: AdminOrderStatus) {
    try {
      await updateOrderStatus(id, to);
      toast.success(`Movido para "${STATUS_LABEL[to]}"`);
      onChanged();
    } catch {
      toast.error("Falha ao mover o pedido.");
    }
  }

  if (orders.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-sm text-slate-400">
        Nenhum pedido encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Itens</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Tempo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => {
              const status = ((o.status as string) === "confirmed" ? "received" : (o.status as string)) as AdminOrderStatus;
              const next = NEXT_STATUS[status];
              const items = o.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                    #{o.short_id}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {items} {items === 1 ? "item" : "itens"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      {o.pickup ? <ShoppingBag className="h-3 w-3" /> : <Bike className="h-3 w-3" />}
                      {o.pickup ? "Retirada" : "Entrega"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{elapsed(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{brl(Number(o.total))}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onOrderClick(o)}>
                        <Eye className="h-3.5 w-3.5" /> Detalhes
                      </Button>
                      {next ? (
                        <Button size="sm" onClick={() => move(o.id, next)}>
                          Avançar
                        </Button>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {KANBAN_COLUMNS.filter((c) => c.id !== status).map((c) => (
                            <DropdownMenuItem key={c.id} onSelect={() => move(o.id, c.id)}>
                              Mover para {c.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// silence unused
void ChevronDown;
