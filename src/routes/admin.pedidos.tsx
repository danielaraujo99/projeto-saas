import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrderKanban } from "@/components/admin/order-kanban";
import { OrderDetailsSheet } from "@/components/admin/order-details-sheet";
import { NewOrderForm } from "@/components/admin/new-order-form";
import { listRestaurantOrders } from "@/lib/admin/admin-orders";
import { useAdminSession } from "@/lib/admin/session";
import { supabase } from "@/lib/custom-supabase";
import type { OrderRow } from "@/lib/orders-api";
import { Loader2, Plus, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos — Painel" },
      { name: "description", content: "Kanban de pedidos em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data: session } = useAdminSession();
  const restaurantId = session?.restaurantId;
  const qc = useQueryClient();
  const [selected, setSelected] = React.useState<OrderRow | null>(null);
  const [openNew, setOpenNew] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [period, setPeriod] = React.useState("today");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "orders", restaurantId],
    queryFn: () => listRestaurantOrders(restaurantId!),
    enabled: !!restaurantId,
    refetchInterval: 30_000,
  });

  React.useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`admin-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["admin", "orders", restaurantId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, qc]);

  const filtered = React.useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(
      (o) =>
        (o.short_id ?? "").toLowerCase().includes(s) ||
        (o as unknown as { customer_name?: string }).customer_name?.toLowerCase().includes(s),
    );
  }, [data, q]);

  return (
    <AdminShell title="Pedidos">
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pedidos</h2>
            <p className="text-sm text-slate-500">Kanban em tempo real do seu operacional.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por número ou cliente…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700"
              >
                <option value="today">Hoje</option>
                <option value="week">Últimos 7 dias</option>
                <option value="month">Este mês</option>
              </select>
            </div>
            <Button onClick={() => setOpenNew(true)}>
              <Plus className="h-4 w-4" /> Novo pedido
            </Button>
          </div>
        </div>

        <div className="mt-5">
          {isLoading || !data ? (
            <div className="grid place-items-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <OrderKanban
              orders={filtered}
              onOrderClick={setSelected}
              onChanged={() => refetch()}
            />
          )}
        </div>
      </div>

      <OrderDetailsSheet
        order={selected}
        onClose={() => setSelected(null)}
        onChanged={() => refetch()}
      />

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo pedido manual</DialogTitle>
            <DialogDescription>
              Adicione itens, dados do cliente, entrega e pagamento. O pedido entra em
              "Recebido" no Kanban.
            </DialogDescription>
          </DialogHeader>
          <NewOrderForm
            onDone={() => {
              setOpenNew(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
