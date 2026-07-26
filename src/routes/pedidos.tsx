import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bike, ChefHat, CheckCircle2, PackageCheck, Receipt, RefreshCw, Star, WifiOff } from "lucide-react";
import { listMyOrders, type OrderRow } from "@/lib/orders-api";
import { statusLabel, type OrderStatus, ACTIVE_STATUSES } from "@/lib/order-status";
import { brl } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — Bistrô Azul" },
      { name: "description", content: "Veja seus pedidos em andamento e o histórico completo." },
      { property: "og:title", content: "Meus pedidos — Bistrô Azul" },
      { property: "og:description", content: "Veja seus pedidos em andamento e o histórico completo." },
    ],
  }),
  component: Page,
});

const icons: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
  pending_payment: Receipt,
  received: CheckCircle2,
  preparing: ChefHat,
  delivering: Bike,
  delivered: PackageCheck,
};

function Page() {
  const [tab, setTab] = React.useState<"active" | "past">("active");
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["orders"],
    queryFn: listMyOrders,
    refetchInterval: 8000,
    retry: 1,
  });


  const orders = data ?? [];
  const active = orders.filter(
    (o) => ACTIVE_STATUSES.includes(o.status as OrderStatus) || o.status === "pending_payment",
  );
  const past = orders.filter((o) => o.status === "delivered");
  const list = tab === "active" ? active : past;

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur md:static md:border-0">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <h1 className="text-lg font-bold">Meus pedidos</h1>
          <div className="mt-3 inline-flex rounded-full bg-surface p-1 text-sm font-semibold">
            <TabButton active={tab === "active"} onClick={() => setTab("active")}>
              Em andamento{active.length ? ` · ${active.length}` : ""}
            </TabButton>
            <TabButton active={tab === "past"} onClick={() => setTab("past")}>
              Finalizados
            </TabButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-foreground/60">Carregando…</div>
        ) : isError ? (
          <EmptyState
            icon={<WifiOff className="h-6 w-6" />}
            title="Falha de conexão"
            description="Não conseguimos carregar seus pedidos. Verifique sua internet e tente novamente."
            action={
              <Button
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-11 rounded-full px-5 text-sm font-semibold"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
                Tentar novamente
              </Button>
            }
          />
        ) : list.length === 0 ? (

          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title={tab === "active" ? "Nenhum pedido em andamento" : "Você ainda não tem histórico"}
            description={
              tab === "active"
                ? "Quando você fizer um pedido, ele aparece aqui em tempo real."
                : "Pedidos entregues ficam guardados aqui para consulta."
            }
            action={
              <Link
                to="/"
                className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                Ver cardápio
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {list.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 transition-colors",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/60",
      )}
    >
      {children}
    </button>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const nav = useNavigate();
  const Icon = icons[order.status as OrderStatus];
  const isActive =
    order.status !== "delivered" && ACTIVE_STATUSES.concat("pending_payment").includes(order.status as OrderStatus);
  const target = order.status === "pending_payment" ? "/pagamento/$id" : "/pedido/$id";
  return (
    <li>
      <button
        onClick={() => nav({ to: target, params: { id: order.id } })}
        className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-full",
              isActive ? "bg-primary text-primary-foreground" : "bg-success/15 text-success",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-foreground">Pedido {order.short_id}</div>
              <div className="text-sm font-bold tabular-nums text-foreground">
                {brl(order.total)}
              </div>
            </div>
            <div className={cn("mt-0.5 text-xs font-medium", isActive ? "text-primary" : "text-foreground/60")}>
              {statusLabel[order.status as OrderStatus]}
            </div>
            <div className="mt-1 line-clamp-1 text-xs text-foreground/55">
              {order.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
            </div>
            {order.status === "delivered" && !order.rated ? (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                <Star className="h-3 w-3" /> Avaliar pedido
              </div>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}
