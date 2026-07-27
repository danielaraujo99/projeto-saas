import * as React from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, QrCode as QrIcon, RefreshCw, TimerOff, AlertCircle } from "lucide-react";
import { getOrderById, confirmPayment } from "@/lib/orders-api";
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

  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.code);
      toast.success("Código Pix copiado");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  return (
    <div className="w-full animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
          <QrIcon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Pagar com Pix</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Total: <span className="font-semibold text-foreground">{brl(total)}</span>
        </p>
      </div>

      <ol className="mt-6 space-y-2 text-sm text-foreground/75">
        <li className="flex gap-2"><span className="font-semibold text-primary">1.</span> Abra o app do seu banco e escolha <b>Pix Copia e Cola</b>.</li>
        <li className="flex gap-2"><span className="font-semibold text-primary">2.</span> Cole o código abaixo e confirme o valor.</li>
        <li className="flex gap-2"><span className="font-semibold text-primary">3.</span> Aguarde nesta tela — a confirmação é automática.</li>
      </ol>

      <div className="mt-5 rounded-2xl border border-border bg-surface p-3">
        <textarea
          readOnly
          value={state.code}
          onFocus={(e) => e.currentTarget.select()}
          className="h-24 w-full resize-none rounded-lg bg-transparent p-2 font-mono text-[11px] leading-snug text-foreground/80 outline-none"
        />
      </div>

      <button
        onClick={copy}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform hover:scale-[1.01]"
      >
        <Copy className="h-4 w-4" /> Copiar código Pix
      </button>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary-soft/60 px-4 py-3">
        <span className="text-xs font-medium text-foreground/70">Expira em</span>
        <span className="text-lg font-bold tabular-nums text-primary">
          {mm}:{ss}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-foreground/60">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Aguardando confirmação do banco…
      </div>
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
