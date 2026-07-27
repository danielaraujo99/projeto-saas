import * as React from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  RefreshCw,
  TimerOff,
  AlertCircle,
  ShieldCheck,
  Info,
  Clock,
  Lock,
  ChevronRight,
  Check,
} from "lucide-react";
import { getOrderById, confirmPayment, type OrderRow } from "@/lib/orders-api";
import { createPixCharge, getPixStatus } from "@/lib/mercadopago.functions";
import { useAuth } from "@/store/auth";
import { brl } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/pagamento/$id")({
  head: () => ({
    meta: [
      { title: "Confirmando pagamento — Restaurante Demo" },
      { name: "description", content: "Confirmação do pagamento do seu pedido." },
      { property: "og:title", content: "Confirmando pagamento — Restaurante Demo" },
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

  // Card / cash: manter simulação existente
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-soft/40 via-background to-background">
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10">
        {phase === "success" ? (
          <SuccessCard total={order.total} />
        ) : phase === "pix_expired" ? (
          <PixExpiredCard total={order.total} onRegenerate={regeneratePix} />
        ) : order.payment.kind === "pix" ? (
          <PixCard
            key={pixCycle}
            orderId={order.id}
            shortId={order.short_id}
            total={order.total}
            onApproved={onPixApproved}
            onExpired={() => setPhase("pix_expired")}
          />
        ) : (
          <ProcessingCard method={order.payment.kind} total={order.total} />
        )}
      </main>
    </div>
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

function PixCard({
  orderId,
  shortId,
  total,
  onApproved,
  onExpired,
}: {
  orderId: string;
  shortId: string;
  total: number;
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

  // Criar cobrança uma vez
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await createFn({
          data: {
            amount: total,
            description: `Pedido ${shortId}`,
            externalReference: orderId,
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

  // Contagem regressiva + expiração
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

  // Polling do status
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
      <div className="w-full animate-fade-in rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elevated)]">
        <PulseLoader label="Gerando código Pix…" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="w-full animate-fade-in rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elevated)]">
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
      toast.success("Código Pix copiado");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  const preview = state.code.length > 28 ? `${state.code.slice(0, 24)}…` : state.code;

  return (
    <div className="w-full max-w-md animate-fade-in">
      <PixHero />

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)] sm:p-7">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Aguardando pagamento
          </span>
          <h1 className="mt-4 text-[22px] font-bold leading-tight tracking-tight sm:text-2xl">
            Pague com Pix em segundos
          </h1>
          <p className="mt-1.5 text-[13px] text-foreground/60">
            Total <span className="font-semibold text-foreground">{brl(total)}</span> · confirmação automática
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              Pix Copia e Cola
            </span>
            <button
              onClick={copy}
              className="text-[11px] font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              Copiar
            </button>
          </div>
          <button
            onClick={copy}
            className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary-soft/40 px-4 py-3.5 text-left transition-colors hover:bg-primary-soft/70"
            aria-label="Copiar código Pix"
          >
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground/80">
              {preview}
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-active:scale-95">
              <Copy className="h-4 w-4" />
            </span>
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-surface p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              Expira em
            </span>
            <span
              className={`text-2xl font-bold tabular-nums transition-colors ${urgent ? "text-destructive" : "text-foreground"}`}
            >
              {mm}:{ss}
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${urgent ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <ol className="mt-5 space-y-2.5">
          {[
            "Abra o app do seu banco",
            "Escolha Pix Copia e Cola e cole o código",
            "Confirme o valor — pronto!",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px] text-foreground/75">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <button
          onClick={copy}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform active:scale-[0.98]"
        >
          <Copy className="h-4 w-4" /> Copiar código Pix
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] text-foreground/45">
        Pagamento processado com segurança · Mercado Pago
      </p>
    </div>
  );
}

function PixHero() {
  return (
    <div className="relative mx-auto grid h-44 w-full place-items-center overflow-hidden sm:h-48">
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_65%)]" />
      </div>
      <span className="pointer-events-none absolute h-28 w-28 rounded-full border border-primary/30 animate-[pixring_2.6s_ease-out_infinite]" />
      <span
        className="pointer-events-none absolute h-28 w-28 rounded-full border border-primary/25 animate-[pixring_2.6s_ease-out_infinite]"
        style={{ animationDelay: "0.9s" }}
      />
      <span
        className="pointer-events-none absolute h-28 w-28 rounded-full border border-primary/20 animate-[pixring_2.6s_ease-out_infinite]"
        style={{ animationDelay: "1.8s" }}
      />
      <span className="pointer-events-none absolute left-[22%] top-[18%] h-1.5 w-1.5 rounded-full bg-primary/70 animate-[pixfloat_3.4s_ease-in-out_infinite]" />
      <span
        className="pointer-events-none absolute right-[20%] top-[30%] h-1 w-1 rounded-full bg-primary/60 animate-[pixfloat_4s_ease-in-out_infinite]"
        style={{ animationDelay: "0.8s" }}
      />
      <span
        className="pointer-events-none absolute right-[26%] bottom-[22%] h-2 w-2 rounded-full bg-primary/50 animate-[pixfloat_3.8s_ease-in-out_infinite]"
        style={{ animationDelay: "1.4s" }}
      />
      <div className="relative grid h-24 w-24 place-items-center rounded-[28%] bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--primary)_55%,black)] shadow-[0_20px_50px_-15px_color-mix(in_oklab,var(--primary)_55%,transparent)] animate-[pixpop_600ms_cubic-bezier(.2,.9,.3,1.2)_both]">
        <svg viewBox="0 0 64 64" className="h-11 w-11 text-primary-foreground">
          <g
            fill="currentColor"
            style={{ transformOrigin: "32px 32px", animation: "pixspin 9s linear infinite" }}
          >
            <path d="M32 6 L46 20 L40 20 L32 12 L24 20 L18 20 Z" opacity="0.95" />
            <path d="M6 32 L20 18 L20 24 L12 32 L20 40 L20 46 Z" opacity="0.9" />
            <path d="M58 32 L44 46 L44 40 L52 32 L44 24 L44 18 Z" opacity="0.9" />
            <path d="M32 58 L18 44 L24 44 L32 52 L40 44 L46 44 Z" opacity="0.95" />
          </g>
          <circle
            cx="32"
            cy="32"
            r="4"
            fill="currentColor"
            style={{ animation: "pixpulse 1.6s ease-in-out infinite" }}
          />
        </svg>
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28%]">
          <span className="absolute -inset-y-6 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[pixsweep_3.2s_ease-in-out_infinite]" />
        </span>
      </div>
      <style>{`
        @keyframes pixring { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(1.9); opacity: 0; } }
        @keyframes pixfloat { 0%,100% { transform: translateY(0); opacity: 0.7; } 50% { transform: translateY(-10px); opacity: 1; } }
        @keyframes pixpop { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pixspin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pixpulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
        @keyframes pixsweep { 0% { transform: translateX(-40%) rotate(12deg); } 60%,100% { transform: translateX(320%) rotate(12deg); } }
      `}</style>
    </div>
  );
}

function PixExpiredCard({
  total,
  onRegenerate,
}: {
  total: number;
  onRegenerate: () => void;
}) {
  return (
    <div className="w-full animate-fade-in rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elevated)]">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-warning/15 text-warning">
        <TimerOff className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-xl font-bold">Código Pix expirado</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Este código não foi pago a tempo. Gere um novo para tentar novamente — nenhum valor foi cobrado.
      </p>
      <p className="mt-4 text-2xl font-bold tabular-nums text-foreground">{brl(total)}</p>
      <button
        onClick={onRegenerate}
        className="mx-auto mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform hover:scale-[1.02]"
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
    <div className="w-full animate-fade-in rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elevated)]">
      <div className="relative mx-auto h-20 w-20">
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
    <div className="w-full animate-scale-in rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elevated)]">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success/15 text-success">
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
