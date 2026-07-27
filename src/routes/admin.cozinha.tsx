import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { KdsCard } from "@/components/admin/kds-card";
import { useAdminSession } from "@/lib/admin/session";
import { listRestaurantOrders } from "@/lib/admin/admin-orders";
import { supabase } from "@/lib/custom-supabase";
import { ChefHat, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/cozinha")({
  head: () => ({
    meta: [
      { title: "Cozinha — Painel" },
      { name: "description", content: "Tela dedicada ao preparo de pedidos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KdsPage,
});

function KdsPage() {
  const { data: session } = useAdminSession();
  const qc = useQueryClient();
  const restaurantId = session?.restaurantId;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["kds", restaurantId],
    queryFn: () => listRestaurantOrders(restaurantId!),
    enabled: !!restaurantId,
    refetchInterval: 20_000,
  });

  React.useEffect(() => {
    if (!restaurantId) return;
    const c = supabase
      .channel(`kds-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => qc.invalidateQueries({ queryKey: ["kds", restaurantId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(c);
    };
  }, [restaurantId, qc]);

  const kitchenOrders = (data ?? []).filter(
    (o) => (o.status as string) === "confirmed" || (o.status as string) === "preparing",
  );

  return (
    <AdminShell title="Cozinha" minimal>
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="grid place-items-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : kitchenOrders.length === 0 ? (
          <div className="mx-auto grid max-w-md place-items-center gap-3 py-24 text-center text-slate-400">
            <ChefHat className="h-10 w-10 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-200">Sem pedidos para preparar</h2>
            <p className="text-sm">
              Novos pedidos confirmados aparecem aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kitchenOrders.map((o) => (
              <KdsCard key={o.id} order={o} onDone={() => refetch()} />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
