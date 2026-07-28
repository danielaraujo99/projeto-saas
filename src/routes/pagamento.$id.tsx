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
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <TopBar orderId={order.id} />
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 pb-8 pt-6 sm:px-6">

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
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto grid h-14 w-full max-w-[520px] grid-cols-[auto_1fr_auto] items-center px-4">
        <Link
          to="/pedido/$id"
          params={{ id: orderId }}
          className="grid h-10 w-10 -ml-2 place-items-center rounded-full text-primary transition-colors hover:bg-primary-soft"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </Link>
        <h1 className="text-center text-[13px] font-bold uppercase tracking-[0.22em] text-foreground/70">
          Pagamento
        </h1>
        <button
          type="button"
          className="text-right text-[13px] font-semibold text-primary hover:underline"
        >
          Ajuda
        </button>
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

  const preview = state.code.length > 22 ? `${state.code.slice(0, 20)}…` : state.code;

  return (
    <div className="flex flex-1 flex-col animate-fade-in pb-24 sm:pb-8">
      <PixHeroIllustration />

      <div className="mt-6 text-center">
        <h1 className="text-[20px] font-bold leading-snug tracking-tight text-foreground/85">
          Pedido aguardando pagamento
        </h1>
        <p className="mx-auto mt-2 max-w-[36ch] text-[13.5px] leading-relaxed text-foreground/60">
          Copie o código e use o <span className="font-semibold text-foreground/80">Pix Copia e Cola</span> no app do seu banco.
        </p>
      </div>

      <button
        onClick={copy}
        className="mx-auto mt-5 flex w-full max-w-[340px] items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-transparent px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-primary-soft/30"
        aria-label="Copiar código Pix"
      >
        <span className="min-w-0 flex-1 truncate font-mono text-[14px] tracking-tight text-foreground/85">
          {preview}
        </span>
        <span className="grid h-7 w-7 shrink-0 place-items-center text-primary transition-transform active:scale-90">
          {copied ? <Check className="h-4.5 w-4.5" strokeWidth={2.5} /> : <Copy className="h-4.5 w-4.5" strokeWidth={2} />}
        </span>
      </button>

      <div className="mt-6 text-center">
        <p className="text-[13px] text-foreground/60">O tempo para pagar acaba em</p>
        <p
          className={`mt-1 text-[28px] font-bold tabular-nums leading-none tracking-tight transition-colors ${
            urgent ? "text-destructive" : "text-foreground"
          }`}
        >
          {mm}:{ss}
        </p>
        <div className="mx-auto mt-3 h-[3px] w-full max-w-[220px] overflow-hidden rounded-full bg-border/60">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${
              urgent ? "bg-destructive" : "bg-primary"
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={copy}
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-[15px] font-bold text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" strokeWidth={2.5} /> Código copiado
            </>
          ) : (
            <>Copiar código</>
          )}
        </button>
        <p className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-[11px] text-foreground/45">
          <ShieldCheck className="h-3.5 w-3.5" />
          Pagamento processado com segurança · Mercado Pago
        </p>
      </div>
    </div>
  );
}




function PixHeroIllustration() {
  return (
    <div className="relative mt-4 grid h-52 w-full place-items-center sm:h-56">
      {/* soft tinted circle backdrop */}
      <div className="absolute h-44 w-44 rounded-full bg-primary-soft/70 sm:h-48 sm:w-48" />
      <div className="pointer-events-none absolute h-44 w-44 rounded-full bg-[radial-gradient(circle_at_30%_25%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_65%)] sm:h-48 sm:w-48" />

      {/* subtle expanding rings */}
      <span className="pointer-events-none absolute h-32 w-32 rounded-full border border-primary/20 animate-[pixring_3s_ease-out_infinite]" />
      <span
        className="pointer-events-none absolute h-32 w-32 rounded-full border border-primary/15 animate-[pixring_3s_ease-out_infinite]"
        style={{ animationDelay: "1.2s" }}
      />

      {/* stylized phone with Pix diamond */}
      <svg
        viewBox="0 0 200 200"
        className="relative h-40 w-40 animate-[pixpop_600ms_cubic-bezier(.2,.9,.3,1.2)_both] sm:h-44 sm:w-44"
      >
        <defs>
          <linearGradient id="phoneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--primary) 92%, black)" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--primary) 65%, black)" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--primary) 30%, white)" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
        </defs>

        {/* phone body */}
        <g style={{ transformOrigin: "100px 100px", animation: "pixtilt 5s ease-in-out infinite" }}>
          <rect x="62" y="32" width="76" height="140" rx="16" fill="url(#phoneGrad)" />
          <rect x="70" y="42" width="60" height="118" rx="8" fill="url(#screenGrad)" />
          {/* speaker slit */}
          <rect x="90" y="38" width="20" height="2.5" rx="1.25" fill="color-mix(in oklab, var(--primary) 40%, black)" opacity="0.5" />

          {/* Pix diamond on screen */}
          <g transform="translate(100 95)">
            <g style={{ transformOrigin: "0 0", animation: "pixslowspin 12s linear infinite" }} fill="var(--primary)">
              <path d="M0 -22 L14 -8 L10 -8 L0 -18 L-10 -8 L-14 -8 Z" opacity="0.95" />
              <path d="M-22 0 L-8 -14 L-8 -10 L-18 0 L-8 10 L-8 14 Z" opacity="0.9" />
              <path d="M22 0 L8 14 L8 10 L18 0 L8 -10 L8 -14 Z" opacity="0.9" />
              <path d="M0 22 L-14 8 L-10 8 L0 18 L10 8 L14 8 Z" opacity="0.95" />
            </g>
            <circle cx="0" cy="0" r="3" fill="var(--primary)" style={{ animation: "pixdot 1.8s ease-in-out infinite" }} />
          </g>

          {/* thin scan line */}
          <rect x="72" y="120" width="56" height="1" fill="var(--primary)" opacity="0.35" />
          <rect x="72" y="128" width="40" height="1" fill="var(--primary)" opacity="0.25" />
          <rect x="72" y="136" width="48" height="1" fill="var(--primary)" opacity="0.2" />
        </g>

        {/* floating clock badge */}
        <g style={{ transformOrigin: "156px 60px", animation: "pixfloat 3.6s ease-in-out infinite" }}>
          <circle cx="156" cy="60" r="18" fill="white" stroke="var(--primary)" strokeWidth="2" />
          <line x1="156" y1="60" x2="156" y2="50" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
          <line x1="156" y1="60" x2="163" y2="60" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="156" cy="60" r="1.5" fill="var(--primary)" />
        </g>

        {/* small floating dot */}
        <circle cx="44" cy="140" r="4" fill="var(--primary)" opacity="0.6" style={{ animation: "pixfloat 4.2s ease-in-out infinite", animationDelay: "0.6s" }} />
        <circle cx="52" cy="60" r="2.5" fill="var(--primary)" opacity="0.5" style={{ animation: "pixfloat 3.8s ease-in-out infinite", animationDelay: "1.2s" }} />
      </svg>

      <style>{`
        @keyframes pixring { 0% { transform: scale(0.7); opacity: 0.7; } 100% { transform: scale(1.7); opacity: 0; } }
        @keyframes pixpop { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pixtilt { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        @keyframes pixslowspin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pixdot { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.5; } }
        @keyframes pixfloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
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
