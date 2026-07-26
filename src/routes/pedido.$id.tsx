import * as React from "react";
import { createFileRoute, Link, Outlet, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bike,
  ChefHat,
  Check,
  CheckCircle2,
  ChevronDown,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  RefreshCw,
  Sparkles,
  Star,
  WifiOff,
} from "lucide-react";
import { getOrderById } from "@/lib/orders-api";
import { statusLabel, TIMELINE, type OrderStatus } from "@/lib/order-status";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { brl } from "@/lib/format";
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
  pending_payment: CheckCircle2,
  received: CheckCircle2,
  preparing: ChefHat,
  delivering: Bike,
  delivered: PackageCheck,
};

// Elapsed thresholds mirror lib/order-status THRESHOLDS to derive per-step timestamps.
const STEP_OFFSETS_MS: Record<OrderStatus, number> = {
  pending_payment: 0,
  received: 0,
  preparing: 20_000,
  delivering: 60_000,
  delivered: 150_000,
};

function formatTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Page() {
  const { id } = useParams({ from: "/pedido/$id" });
  const nav = useNavigate();

  const { data: order, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id),
    refetchInterval: 5000,
    retry: 1,
  });

  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const t = setInterval(force, 1000);
    return () => clearInterval(t);
  }, []);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-foreground/60">Carregando pedido…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            icon={<WifiOff className="h-6 w-6" />}
            title="Falha de conexão"
            description="Não conseguimos carregar seu pedido. Verifique sua internet e tente de novo."
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
        </div>
      </div>
    );
  }

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

  const currentIdx = TIMELINE.indexOf(order.status as OrderStatus);
  const paymentAt = order.payment_confirmed_at ? new Date(order.payment_confirmed_at) : null;
  const startAt = paymentAt?.getTime() ?? new Date(order.created_at).getTime();
  const elapsedMin = Math.floor((Date.now() - startAt) / 60000);
  const etaLeft = Math.max(0, order.eta_minutes - elapsedMin);

  // Progress ratio (0..1) inside current segment for animated fill between prev and current step.
  const currentOffset = STEP_OFFSETS_MS[order.status as OrderStatus] ?? 0;
  const nextStep = TIMELINE[currentIdx + 1];
  const nextOffset = nextStep ? STEP_OFFSETS_MS[nextStep] : currentOffset;
  const segmentSpan = Math.max(1, nextOffset - currentOffset);
  const segmentElapsed = paymentAt ? Date.now() - paymentAt.getTime() - currentOffset : 0;
  const segmentRatio =
    order.status === "delivered"
      ? 1
      : Math.max(0, Math.min(1, segmentElapsed / segmentSpan));

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/pedidos"
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Pedido {order.short_id}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
        {/* HERO STATUS + TIMELINE */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border/60 bg-gradient-to-b from-primary-soft/60 to-transparent px-5 py-6 sm:px-6">
            {order.status === "delivered" ? (
              <DeliveredHero
                rated={order.rated}
                onRate={() => nav({ to: "/pedido/$id/avaliar", params: { id: order.id } })}
              />
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                  Chegada estimada
                </p>
                <p className="mt-1 text-4xl font-bold tabular-nums text-foreground">
                  {etaLeft > 0 ? `${etaLeft} min` : "a qualquer momento"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <p className="text-sm font-medium text-primary">
                    {statusLabel[order.status as OrderStatus]}
                  </p>
                </div>
              </>
            )}
          </div>

          <ol className="relative px-5 py-6 sm:px-6">
            {TIMELINE.map((s, i) => {
              const Icon = icons[s];
              const active = i === currentIdx && order.status !== "delivered";
              const done = i < currentIdx || order.status === "delivered";
              const isLast = i === TIMELINE.length - 1;
              const stepAt = paymentAt
                ? new Date(paymentAt.getTime() + STEP_OFFSETS_MS[s])
                : null;
              return (
                <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Connector line */}
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-5 top-10 h-[calc(100%-1.5rem)] w-0.5 rounded-full bg-border"
                    >
                      <span
                        className="block w-full rounded-full bg-primary transition-[height] duration-1000 ease-out"
                        style={{
                          height:
                            done && i < currentIdx
                              ? "100%"
                              : active
                                ? `${segmentRatio * 100}%`
                                : "0%",
                        }}
                      />
                    </span>
                  )}

                  <div
                    className={cn(
                      "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40" />
                    )}
                    {done && !active ? (
                      <Check className="h-5 w-5" strokeWidth={3} />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 pt-1.5">
                    <div
                      className={cn(
                        "text-sm font-semibold leading-tight",
                        done || active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {statusLabel[s]}
                    </div>
                    {done && stepAt ? (
                      <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {formatTime(stepAt)}
                      </div>
                    ) : active ? (
                      <div className="mt-0.5 text-xs font-medium text-primary">Em andamento…</div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* CONTEXTUAL AREA */}
        <ContextualPhase status={order.status as OrderStatus} />

        {/* COURIER CARD (during delivery) */}
        {order.status === "delivering" ? <CourierCard /> : null}

        {/* COLLAPSIBLE ORDER DETAILS */}
        <Collapsible className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <CollapsibleTrigger className="group flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface/40">
            <div>
              <div className="text-sm font-semibold text-foreground">Detalhes do pedido</div>
              <div className="text-xs text-muted-foreground">
                {order.items.reduce((n, i) => n + i.quantity, 0)} itens · {brl(order.total)}
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <ul className="divide-y divide-border/60 border-t border-border">
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
              <Row
                label={order.pickup ? "Retirada" : "Taxa de entrega"}
                value={brl(order.delivery_fee)}
              />
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
          </CollapsibleContent>
        </Collapsible>

        {/* SUPPORT — reduced */}
        <div className="flex items-center justify-center pt-2">
          <a
            href="tel:+551140028922"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" />
            Precisa de ajuda? Falar com o suporte
          </a>
        </div>
      </main>
      <Outlet />
    </div>
  );
}

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

function DeliveredHero({ rated, onRate }: { rated: boolean; onRate: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <div className="relative grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-6 w-6" />
        <Sparkles className="absolute -right-1 -top-1 h-4 w-4 animate-pulse text-success" />
      </div>
      <div>
        <h2 className="text-lg font-bold">Pedido entregue</h2>
        <p className="text-sm text-muted-foreground">
          Esperamos que você tenha gostado! Que tal avaliar?
        </p>
        {!rated ? (
          <button
            onClick={onRate}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            <Star className="h-4 w-4" /> Avaliar pedido
          </button>
        ) : (
          <p className="mt-2 text-sm text-success">Obrigado pela avaliação!</p>
        )}
      </div>
    </div>
  );
}

function ContextualPhase({ status }: { status: OrderStatus }) {
  if (status === "received") {
    return (
      <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pedido confirmado</h3>
          <p className="text-xs text-muted-foreground">
            O restaurante recebeu seu pedido e vai começar o preparo em instantes.
          </p>
        </div>
      </section>
    );
  }
  if (status === "preparing") {
    return (
      <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <ChefHat className="h-6 w-6 animate-[pulse_2s_ease-in-out_infinite]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Preparando seu pedido</h3>
          <p className="text-xs text-muted-foreground">
            A cozinha está caprichando nos detalhes. Não vai demorar.
          </p>
        </div>
      </section>
    );
  }
  if (status === "delivering") {
    return <DeliveryProgress />;
  }
  return null;
}

function CourierCard() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <span className="text-sm font-bold">MR</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">Marcos R.</div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bike className="h-3.5 w-3.5" /> Moto · Entregador parceiro
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:+551140028922"
            aria-label="Ligar para o entregador"
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground hover:bg-surface"
          >
            <Phone className="h-4 w-4" />
          </a>
          <a
            href="sms:+551140028922"
            aria-label="Mensagem para o entregador"
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-95"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function DeliveryProgress() {
  const [pct, setPct] = React.useState(15);
  React.useEffect(() => {
    const t = setInterval(() => setPct((p) => Math.min(95, p + 4)), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Entregador a caminho</h3>
        <span className="text-xs font-medium text-primary">Ao vivo</span>
      </div>
      <div
        className="relative h-28 overflow-hidden rounded-xl border border-border"
        style={{
          backgroundImage:
            "linear-gradient(180deg, oklch(0.98 0.01 240) 0%, oklch(0.96 0.015 240) 100%)",
        }}
      >
        {/* subtle map grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.9 0.01 240) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.9 0.01 240) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* route line */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 112" preserveAspectRatio="none">
          <path
            d="M 12 90 Q 90 30, 160 60 T 288 40"
            fill="none"
            stroke="oklch(0.85 0.03 240)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 12 90 Q 90 30, 160 60 T 288 40"
            fill="none"
            stroke="var(--primary, oklch(0.55 0.2 250))"
            strokeWidth="2.5"
            strokeDasharray="500"
            strokeDashoffset={500 - (pct / 100) * 500}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* courier marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
          style={{ left: `calc(${pct}% - 20px)` }}
        >
          <div className="relative grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]">
            <span className="absolute inset-0 -z-0 animate-ping rounded-full bg-primary/40" />
            <Bike className="relative h-5 w-5" />
          </div>
        </div>
        {/* destination */}
        <div className="absolute right-3 top-2 grid h-8 w-8 place-items-center rounded-full bg-background text-primary shadow-[var(--shadow-card)]">
          <MapPin className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
}
