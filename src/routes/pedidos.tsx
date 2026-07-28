import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bike, ChefHat, CheckCircle2, PackageCheck, Receipt, RefreshCw, Star, WifiOff } from "lucide-react";
import { listMyOrders, type OrderRow } from "@/lib/orders-api";
import { statusLabel, type OrderStatus, ACTIVE_STATUSES } from "@/lib/order-status";
import { brl } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — Restaurante Demo" },
      { name: "description", content: "Veja seus pedidos em andamento e o histórico completo." },
      { property: "og:title", content: "Meus pedidos — Restaurante Demo" },
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
          <OrdersSkeleton />
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

function usePixTick(active: boolean) {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    if (!active) return;
    const t = window.setInterval(force, 1000);
    return () => window.clearInterval(t);
  }, [active]);
}

function OrderCard({ order }: { order: OrderRow }) {
  const nav = useNavigate();
  const [session, setSession] = React.useState<PixSession | null>(null);
  const isPending = order.status === "pending_payment";

  React.useEffect(() => {
    if (!isPending) return;
    setSession(getPixSession(order.id));
  }, [isPending, order.id]);

  usePixTick(isPending && !!session);

  const expired = isPixExpired(session);
  const livePix = session && !expired ? session : null;

  const Icon = expired ? TimerOff : icons[order.status as OrderStatus];
  const isActive =
    !expired &&
    order.status !== "delivered" &&
    ACTIVE_STATUSES.concat("pending_payment").includes(order.status as OrderStatus);
  const target = isPending && !expired ? "/pagamento/$id" : "/pedido/$id";

  const statusText = expired
    ? "Pagamento expirado · Pedido cancelado"
    : statusLabel[order.status as OrderStatus];

  const remaining = livePix ? pixRemainingMs(livePix) : 0;
  const progress = livePix ? remaining / pixTotalMs(livePix) : 0;
  const urgent = remaining <= 60_000;

  return (
    <li>
      <div
        className={cn(
          "w-full rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]",
          expired ? "border-destructive/25" : "border-border",
        )}
      >
        <button
          onClick={() => nav({ to: target, params: { id: order.id } })}
          className="w-full p-4 text-left"
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-full",
                expired
                  ? "bg-destructive/12 text-destructive"
                  : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-success/15 text-success",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-foreground">Pedido {order.short_id}</div>
                <div
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    expired ? "text-foreground/50 line-through" : "text-foreground",
                  )}
                >
                  {brl(order.total)}
                </div>
              </div>
              <div
                className={cn(
                  "mt-0.5 text-xs font-medium",
                  expired
                    ? "text-destructive"
                    : isActive
                      ? "text-primary"
                      : "text-foreground/60",
                )}
              >
                {statusText}
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

        {livePix ? (
          <div className="border-t border-border/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/50">
                Pix aguardando pagamento
              </span>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  urgent ? "text-destructive" : "text-foreground",
                )}
              >
                {formatCountdown(remaining)}
              </span>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-border/60">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-1000 ease-linear",
                  urgent ? "bg-destructive" : "bg-primary",
                )}
                style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => nav({ to: "/pagamento/$id", params: { id: order.id } })}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-[12px] font-bold uppercase tracking-[0.12em] text-primary-foreground transition-transform active:scale-[0.98]"
              >
                Efetuar pagamento
              </button>
              <CopyPixButton code={livePix.code} />
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function CopyPixButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={copy}
      aria-label="Copiar código Pix"
      className="inline-flex h-10 w-11 items-center justify-center rounded-xl border border-border text-primary transition-colors hover:bg-primary-soft/50"
    >
      {copied ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Copy className="h-4 w-4" />}
    </button>
  );
}



function OrdersSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full max-w-[240px]" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
