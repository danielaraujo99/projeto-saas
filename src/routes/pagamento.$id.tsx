import * as React from "react";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  RefreshCw,
  TimerOff,
  AlertCircle,
  ChevronLeft,
  ChevronDown,
  Check,
  ShieldCheck,
} from "lucide-react";
import { getOrderById, confirmPayment, type OrderRow } from "@/lib/orders-api";
import { createPixCharge, getPixStatus } from "@/lib/mercadopago.functions";
import { useAuth } from "@/store/auth";
import { brl } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/pagamento/$id")({
  head: () => ({
    meta: [
      { title: "Confirmando pagamento — MenuAtlas" },
      { name: "description", content: "Confirmação do pagamento do seu pedido." },
      { property: "og:title", content: "Confirmando pagamento — MenuAtlas" },
      { property: "og:description", content: "Confirmação do pagamento do seu pedido." },
    ],
  }),
  component: Page,
});

type Phase = "loading" | "awaiting_pix" | "processing" | "success" | "pix_expired";

const CARD_CONFIRM_MS = 2200;
const POLL_INTERVAL_MS = 3000;

function Page() {
  const { id } = useParams({ from: "/pagamento/$id" });
  const nav = useNavigate();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id),
  });
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [pixCycle, setPixCycle] = React.useState(0);
  const confirmedRef = React.useRef(false);

  React.useEffect(() => {
    if (!order) return;
    if (order.status !== "pending_payment") {
      nav({ to: "/pedido/$id", params: { id: order.id }, replace: true });
      return;
    }
    setPhase(order.payment.kind === "pix" ? "awaiting_pix" : "processing");
  }, [order, nav]);

  React.useEffect(() => {
    if (!order) return;
    if (confirmedRef.current) return;
    if (phase !== "processing") return;
    const t = window.setTimeout(async () => {
      confirmedRef.current = true;
      try {
        await confirmPayment(order.id);
        setPhase("success");
        window.setTimeout(() => {
          nav({ to: "/pedido/$id", params: { id: order.id }, replace: true });
        }, 1600);
      } catch (e) {
        console.error(e);
        toast.error("Falha ao confirmar pagamento. Tente novamente.");
      }
    }, CARD_CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [order, phase, nav]);

  const onPixApproved = React.useCallback(async () => {
    if (!order || confirmedRef.current) return;
    confirmedRef.current = true;
    try {
      await confirmPayment(order.id);
      setPhase("success");
      window.setTimeout(() => {
        nav({ to: "/pedido/$id", params: { id: order.id }, replace: true });
      }, 1600);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao confirmar pagamento.");
    }
  }, [order, nav]);

  const regeneratePix = () => {
    confirmedRef.current = false;
    setPhase("awaiting_pix");
    setPixCycle((c) => c + 1);
  };

  if (isLoading || !order) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <PulseLoader label="Carregando pedido…" />
      </div>
    );
  }

  const isPix = order.payment.kind === "pix";

  return (
    <div className="min-h-screen bg-background">
      <TopBar orderId={order.id} />
      <main className="mx-auto flex w-full max-w-[440px] flex-col px-5 pb-10 pt-4 sm:px-6">
        {phase === "success" ? (
          <SuccessCard total={order.total} />
        ) : phase === "pix_expired" ? (
          <PixExpiredCard total={order.total} onRegenerate={regeneratePix} />
        ) : isPix ? (
          <PixView
            key={pixCycle}
            order={order}
            onApproved={onPixApproved}
            onExpired={() => setPhase("pix_expired")}
          />
        ) : (
          <ProcessingCard method={order.payment.kind as "credit" | "debit" | "cash"} total={order.total} />
        )}
      </main>
    </div>
  );
}

function TopBar({ orderId }: { orderId: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto grid h-14 w-full max-w-[440px] grid-cols-[auto_1fr_auto] items-center px-3 sm:px-4">
        <Link
          to="/pedido/$id"
          params={{ id: orderId }}
          className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-muted"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-foreground/80">
          Pagamento
        </h1>
        <div className="w-10" />
      </div>
    </header>
  );
}

function PulseLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
        <span className="absolute inset-2 rounded-full bg-primary" />
      </div>
      <p className="text-sm font-medium text-foreground/70">{label}</p>
    </div>
  );
}

function PixView({
  order,
  onApproved,
  onExpired,
}: {
  order: OrderRow;
  onApproved: () => void;
  onExpired: () => void;
}) {
  const createFn = useServerFn(createPixCharge);
  const statusFn = useServerFn(getPixStatus);
  const email = useAuth((s) => s.user?.email);

  const [state, setState] = React.useState<
    | { phase: "creating" }
    | { phase: "error"; message: string }
    | { phase: "ready"; paymentId: number; code: string; deadline: number }
  >({ phase: "creating" });
  const [remaining, setRemaining] = React.useState(5 * 60_000);
  const [copied, setCopied] = React.useState(false);
  const [howOpen, setHowOpen] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await createFn({
          data: {
            amount: order.total,
            description: `Pedido ${order.short_id}`,
            externalReference: order.id,
            payerEmail: email,
            expirationMinutes: 5,
          },
        });
        if (cancelled) return;
        if (!res.qrCode) {
          setState({ phase: "error", message: "Mercado Pago não retornou o código Pix." });
          return;
        }
        setState({
          phase: "ready",
          paymentId: res.id,
          code: res.qrCode,
          deadline: new Date(res.expiresAt).getTime(),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Falha ao gerar Pix.";
        setState({ phase: "error", message: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (state.phase !== "ready") return;
    const tick = () => {
      const left = Math.max(0, state.deadline - Date.now());
      setRemaining(left);
      if (left === 0) onExpired();
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [state, onExpired]);

  React.useEffect(() => {
    if (state.phase !== "ready") return;
    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      try {
        const s = await statusFn({ data: { paymentId: state.paymentId } });
        if (s.status === "approved") {
          stopped = true;
          onApproved();
          return;
        }
        if (["cancelled", "rejected", "refunded", "charged_back"].includes(s.status)) {
          stopped = true;
          onExpired();
          return;
        }
      } catch (e) {
        console.warn("[pix poll]", e);
      }
    };
    const t = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      window.clearInterval(t);
    };
  }, [state, statusFn, onApproved, onExpired]);

  if (state.phase === "creating") {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <PulseLoader label="Gerando código Pix…" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/15 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold">Não foi possível gerar o Pix</h1>
        <p className="mt-2 break-words text-sm text-foreground/60">{state.message}</p>
      </div>
    );
  }

  const totalMs = 5 * 60_000;
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const progress = Math.max(0, Math.min(1, remaining / totalMs));
  const urgent = remaining <= 60_000;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  const preview = state.code.length > 28 ? `${state.code.slice(0, 26)}…` : state.code;

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <PixHeroIllustration />

      <h1 className="mt-6 text-center text-[22px] font-bold leading-snug tracking-tight text-foreground sm:text-[24px]">
        Pedido aguardando pagamento
      </h1>
      <p className="mt-2 max-w-[36ch] text-center text-[14px] leading-relaxed text-foreground/60">
        Copie o código abaixo e utilize o <span className="font-semibold text-foreground/80">Pix Copia e Cola</span> no app do seu banco.
      </p>

      <button
        onClick={copy}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-primary/60 hover:bg-primary-soft/30"
        aria-label="Copiar código Pix"
      >
        <span className="min-w-0 flex-1 truncate font-mono text-[14px] tracking-tight text-foreground/85">
          {preview}
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary transition-transform active:scale-90">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </span>
      </button>

      <div className="mt-6 w-full">
        <p className="text-[13px] text-foreground/60">O tempo para você pagar acaba em:</p>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span
            className={`text-[34px] font-bold tabular-nums leading-none tracking-tight transition-colors ${urgent ? "text-destructive" : "text-foreground"}`}
          >
            {mm}:{ss}
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-foreground/50">
            {brl(order.total)}
          </span>
        </div>
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-border/70">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${urgent ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-6 w-full divide-y divide-border/70 border-y border-border/70">
        <Disclosure open={howOpen} onToggle={() => setHowOpen((v) => !v)} label="Como funciona">
          <ol className="space-y-3 pb-4 text-[13.5px] leading-relaxed text-foreground/75">
            {[
              "Copie o código Pix acima.",
              "Abra o app do seu banco e escolha Pix Copia e Cola.",
              "Cole o código, confira o valor e confirme.",
              "A confirmação é automática — você será redirecionado.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-[2px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Disclosure>
        <Disclosure
          open={summaryOpen}
          onToggle={() => setSummaryOpen((v) => !v)}
          label="Resumo do pedido"
          hint={`#${order.short_id}`}
        >
          <OrderSummary order={order} />
        </Disclosure>
      </div>

      <button
        onClick={copy}
        className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform active:scale-[0.98]"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" /> Código copiado
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" /> Copiar código
          </>
        )}
      </button>

      <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-foreground/45">
        <ShieldCheck className="h-3.5 w-3.5" />
        Pagamento processado com segurança · Mercado Pago
      </p>
    </div>
  );
}

function Disclosure({
  open,
  onToggle,
  label,
  hint,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold text-foreground">{label}</span>
        <span className="flex items-center gap-2">
          {hint && (
            <span className="text-[12px] font-medium text-foreground/50">{hint}</span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-foreground/50 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open && <div className="animate-fade-in">{children}</div>}
    </div>
  );
}

function OrderSummary({ order }: { order: OrderRow }) {
  const itemsCount = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <div className="pb-4">
      <ul className="space-y-2">
        {order.items.map((it, idx) => (
          <li
            key={`${it.productId}-${idx}`}
            className="flex items-start justify-between gap-3 text-[13px]"
          >
            <span className="min-w-0 flex-1 truncate text-foreground/75">
              <span className="mr-1 font-semibold text-foreground">{it.quantity}×</span>
              {it.name}
            </span>
            <span className="shrink-0 tabular-nums text-foreground/65">
              {brl(it.unitPrice * it.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-1.5 border-t border-border/70 pt-3 text-[13px]">
        <Row label={`Itens (${itemsCount})`} value={brl(order.subtotal)} />
        {order.delivery_fee > 0 && <Row label="Taxa de entrega" value={brl(order.delivery_fee)} />}
        {order.discount > 0 && (
          <Row label="Desconto" value={`− ${brl(order.discount)}`} accent="text-success" />
        )}
        <div className="flex items-baseline justify-between pt-2 text-[14px] font-semibold">
          <span className="text-foreground">Total</span>
          <span className="tabular-nums text-foreground">{brl(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-foreground/60">{label}</span>
      <span className={`tabular-nums ${accent ?? "text-foreground/80"}`}>{value}</span>
    </div>
  );
}

function PixHeroIllustration() {
  return (
    <div className="relative mt-2 grid h-40 w-full place-items-center sm:h-44">
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_70%)]" />
      </div>
      <span className="pointer-events-none absolute h-24 w-24 rounded-full border border-primary/25 animate-[pixring_2.8s_ease-out_infinite]" />
      <span
        className="pointer-events-none absolute h-24 w-24 rounded-full border border-primary/20 animate-[pixring_2.8s_ease-out_infinite]"
        style={{ animationDelay: "1s" }}
      />
      <div className="relative grid h-[88px] w-[88px] place-items-center rounded-[26%] bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--primary)_55%,black)] shadow-[0_18px_40px_-14px_color-mix(in_oklab,var(--primary)_55%,transparent)] animate-[pixpop_500ms_cubic-bezier(.2,.9,.3,1.2)_both]">
        <svg viewBox="0 0 64 64" className="h-10 w-10 text-primary-foreground">
          <g fill="currentColor">
            <path d="M32 6 L46 20 L40 20 L32 12 L24 20 L18 20 Z" opacity="0.95" />
            <path d="M6 32 L20 18 L20 24 L12 32 L20 40 L20 46 Z" opacity="0.9" />
            <path d="M58 32 L44 46 L44 40 L52 32 L44 24 L44 18 Z" opacity="0.9" />
            <path d="M32 58 L18 44 L24 44 L32 52 L40 44 L46 44 Z" opacity="0.95" />
          </g>
        </svg>
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26%]">
          <span className="absolute -inset-y-6 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[pixsweep_3.4s_ease-in-out_infinite]" />
        </span>
      </div>
      <style>{`
        @keyframes pixring { 0% { transform: scale(0.7); opacity: 0.8; } 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes pixpop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pixsweep { 0% { transform: translateX(-40%) rotate(12deg); } 60%,100% { transform: translateX(320%) rotate(12deg); } }
      `}</style>
    </div>
  );
}

function PixExpiredCard({ total, onRegenerate }: { total: number; onRegenerate: () => void }) {
  return (
    <div className="mt-10 flex flex-col items-center text-center animate-fade-in">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-warning/15 text-warning">
        <TimerOff className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-xl font-bold">Código Pix expirado</h1>
      <p className="mt-2 max-w-[36ch] text-sm text-foreground/60">
        Este código não foi pago a tempo. Gere um novo para tentar novamente — nenhum valor foi cobrado.
      </p>
      <p className="mt-5 text-2xl font-bold tabular-nums text-foreground">{brl(total)}</p>
      <button
        onClick={onRegenerate}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform hover:scale-[1.02]"
      >
        <RefreshCw className="h-4 w-4" /> Gerar novo código
      </button>
    </div>
  );
}

function ProcessingCard({ method, total }: { method: "credit" | "debit" | "cash"; total: number }) {
  const label =
    method === "cash" ? "Registrando pagamento em dinheiro" : "Processando pagamento no cartão";
  return (
    <div className="mt-12 flex flex-col items-center text-center animate-fade-in">
      <div className="relative h-20 w-20">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <span className="absolute inset-2 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
      <h1 className="mt-6 text-xl font-bold">{label}</h1>
      <p className="mt-1 text-sm text-foreground/60">Isso leva apenas alguns segundos.</p>
      <p className="mt-4 text-2xl font-bold tabular-nums text-primary">{brl(total)}</p>
    </div>
  );
}

function SuccessCard({ total }: { total: number }) {
  return (
    <div className="mt-12 flex flex-col items-center text-center animate-scale-in">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-success/15 text-success">
        <CheckDraw />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Pagamento confirmado</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Seu pedido foi enviado ao restaurante. Redirecionando…
      </p>
      <p className="mt-4 text-2xl font-bold tabular-nums text-success">{brl(total)}</p>
    </div>
  );
}

function CheckDraw() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10">
      <path
        d="M4 12l5 5L20 7"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 30,
          strokeDashoffset: 30,
          animation: "checkDraw 0.55s ease-out forwards",
        }}
      />
      <style>{`@keyframes checkDraw { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}
