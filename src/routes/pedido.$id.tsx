import * as React from "react";
import { createFileRoute, Link, Outlet, useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bike, ChefHat, CheckCircle2, MapPin, PackageCheck, Phone, Star } from "lucide-react";
import { STATUS_STEPS, statusLabel, useOrders } from "@/store/orders";
import { EmptyState } from "@/components/empty-state";
import { brl } from "@/lib/format";
import type { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Acompanhamento do pedido — Bistrô Azul" },
      { name: "description", content: "Acompanhe o status do seu pedido em tempo real." },
      { property: "og:title", content: "Acompanhamento do pedido — Bistrô Azul" },
      { property: "og:description", content: "Acompanhe o status do seu pedido em tempo real." },
    ],
  }),
  component: Page,
});

const icons: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
  received: CheckCircle2,
  preparing: ChefHat,
  delivering: Bike,
  delivered: PackageCheck,
};

function Page() {
  const { id } = useParams({ from: "/pedido/$id" });
  const order = useOrders((s) => s.orders[id]);
  const nav = useNavigate();

  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const t = setInterval(force, 1000);
    return () => clearInterval(t);
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            icon={<PackageCheck className="h-6 w-6" />}
            title="Pedido não encontrado"
            description="Pode ter sido removido ou o link está incorreto."
            action={
              <Link
                to="/"
                className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                Voltar ao cardápio
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(order.status);
  const elapsedMin = Math.floor((Date.now() - order.createdAt) / 60000);
  const etaLeft = Math.max(0, order.etaMinutes - elapsedMin);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            aria-label="Início"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Pedido {order.id}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          {order.status === "delivered" ? (
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Pedido entregue</h2>
                <p className="text-sm text-muted-foreground">
                  Esperamos que você tenha gostado! Que tal avaliar?
                </p>
                {!order.rated ? (
                  <button
                    onClick={() => nav({ to: "/pedido/$id/avaliar", params: { id: order.id } })}
                    className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
                  >
                    <Star className="h-4 w-4" /> Avaliar pedido
                  </button>
                ) : (
                  <p className="mt-2 text-sm text-success">Obrigado pela avaliação!</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Chegada estimada</p>
              <p className="text-3xl font-bold tabular-nums">
                {etaLeft > 0 ? `${etaLeft} min` : "a qualquer momento"}
              </p>
              <p className="mt-1 text-sm font-medium text-primary">
                {statusLabel[order.status]}
              </p>
            </>
          )}

          <ol className="mt-6 space-y-4">
            {STATUS_STEPS.map((s, i) => {
              const Icon = icons[s];
              const active = i === currentIdx;
              const done = i < currentIdx || order.status === "delivered";
              return (
                <li key={s} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-full",
                      done
                        ? "bg-success text-success-foreground"
                        : active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        done || active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {statusLabel[s]}
                    </div>
                  </div>
                  {active && s !== "delivered" ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>

        {order.status === "delivering" ? <DeliveryProgress /> : null}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Precisa de ajuda?</h3>
            <a
              href="tel:+551140028922"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface"
            >
              <Phone className="h-3.5 w-3.5" /> Suporte
            </a>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Detalhes do pedido</h3>
            <span className="text-xs font-medium text-foreground/50">
              #{order.id}
            </span>
          </div>

          <ul className="divide-y divide-border/60">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-0.5 grid h-6 min-w-[1.75rem] shrink-0 place-items-center rounded-md bg-primary-soft px-1.5 text-xs font-bold tabular-nums text-primary">
                  {it.quantity}
                </span>
                <span className="min-w-0 flex-1 text-sm text-foreground">
                  <span className="line-clamp-2">{it.name}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {brl(it.unitPrice * it.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-1.5 border-t border-border bg-surface/40 px-5 py-4 text-sm">
            <Row label="Subtotal" value={brl(order.subtotal)} />
            {order.discount > 0 ? (
              <Row label="Desconto" value={`- ${brl(order.discount)}`} tone="success" />
            ) : null}
            <Row label={order.pickup ? "Retirada" : "Taxa de entrega"} value={brl(order.deliveryFee)} />
            <div className="mt-2 border-t border-border pt-2">
              <Row bold label="Total" value={brl(order.total)} />
            </div>
          </div>

          {order.address ? (
            <div className="flex items-start gap-3 border-t border-border px-5 py-4">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
                  {order.pickup ? "Retirada em" : "Entregar em"}
                </div>
                <div className="mt-0.5 font-medium text-foreground">
                  {order.address.street}, {order.address.number}
                </div>
                <div className="text-xs text-foreground/60">
                  {order.address.neighborhood} · {order.address.city}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
      <Outlet />
    </div>
  );
}
// eslint-disable-next-line
const _outletKeep = true;

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "success";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span
        className={
          "tabular-nums " +
          (bold ? "font-bold " : "") +
          (tone === "success" ? "text-success" : "")
        }
      >
        {value}
      </span>
    </div>
  );
}

function DeliveryProgress() {
  const [pct, setPct] = React.useState(15);
  React.useEffect(() => {
    const t = setInterval(() => setPct((p) => Math.min(95, p + 4)), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-3 text-sm font-semibold">Entregador a caminho</h3>
      <div className="relative h-24 overflow-hidden rounded-xl bg-gradient-to-r from-primary-soft to-surface">
        <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000"
            style={{ width: pct + "%" }}
          />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000"
          style={{ left: `calc(${pct}% - 20px)` }}
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]">
            <Bike className="h-5 w-5" />
          </div>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-background text-primary shadow-[var(--shadow-card)]">
            📍
          </div>
        </div>
      </div>
    </section>
  );
}
