import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrderKanban } from "@/components/admin/order-kanban";
import { OrderDetailsSheet } from "@/components/admin/order-details-sheet";
import { listRestaurantOrders } from "@/lib/admin/admin-orders";
import { useAdminSession } from "@/lib/admin/session";
import { supabase } from "@/lib/custom-supabase";
import type { OrderRow } from "@/lib/orders-api";
import { Loader2 } from "lucide-react";

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

  return (
    <AdminShell title="Pedidos">
      <div className="p-4 sm:p-6">
        {isLoading || !data ? (
          <div className="grid place-items-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <OrderKanban
            orders={data}
            onOrderClick={setSelected}
            onChanged={() => refetch()}
          />
        )}
      </div>
      <OrderDetailsSheet
        order={selected}
        onClose={() => setSelected(null)}
        onChanged={() => refetch()}
      />
    </AdminShell>
  );
}
