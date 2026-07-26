import * as React from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, QrCode as QrIcon, RefreshCw, TimerOff } from "lucide-react";
import { getOrderById, confirmPayment } from "@/lib/orders-api";
import { brl } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

export const Route = createFileRoute("/pagamento/$id")({
  head: () => ({
    meta: [
      { title: "Confirmando pagamento — Bistrô Azul" },
      { name: "description", content: "Confirmação do pagamento do seu pedido." },
      { property: "og:title", content: "Confirmando pagamento — Bistrô Azul" },
      { property: "og:description", content: "Confirmação do pagamento do seu pedido." },
    ],
  }),
  component: Page,
});

type Phase = "loading" | "awaiting_pix" | "processing" | "success" | "pix_expired";

const PIX_EXPIRATION_MS = 3 * 60 * 1000; // 3 minutos
const PIX_CONFIRM_MS = 6000;
const CARD_CONFIRM_MS = 2200;

function Page() {
  const { id } = useParams({ from: "/pagamento/$id" });
  const nav = useNavigate();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id),
  });
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [pixCycle, setPixCycle] = React.useState(0);
  const [pixDeadline, setPixDeadline] = React.useState<number | null>(null);
  const confirmedRef = React.useRef(false);

  React.useEffect(() => {
    if (!order) return;
    if (order.status !== "pending_payment") {
      nav({ to: "/pedido/$id", params: { id: order.id }, replace: true });
      return;
    }
    setPhase(order.payment.kind === "pix" ? "awaiting_pix" : "processing");
  }, [order, nav]);

  // Simulated payment confirmation + Pix expiration timer.
  React.useEffect(() => {
    if (!order) return;
    if (confirmedRef.current) return;
    if (phase !== "awaiting_pix" && phase !== "processing") return;

    const confirmDelay = phase === "awaiting_pix" ? PIX_CONFIRM_MS : CARD_CONFIRM_MS;
    const confirmT = window.setTimeout(async () => {
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
    }, confirmDelay);

    let expireT: number | undefined;
    if (phase === "awaiting_pix") {
      const deadline = Date.now() + PIX_EXPIRATION_MS;
      setPixDeadline(deadline);
      expireT = window.setTimeout(() => {
        if (confirmedRef.current) return;
        setPhase("pix_expired");
      }, PIX_EXPIRATION_MS);
    }

    return () => {
      window.clearTimeout(confirmT);
      if (expireT) window.clearTimeout(expireT);
    };
  }, [order, phase, nav, pixCycle]);

  const regeneratePix = () => {
    confirmedRef.current = false;
    setPhase("awaiting_pix");
    setPixCycle((c) => c + 1);
    toast.success("Novo código Pix gerado");
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
          <PixWaitingCard
            key={pixCycle}
            total={order.total}
            shortId={order.short_id}
            deadline={pixDeadline}
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

function PixWaitingCard({ total, shortId }: { total: number; shortId: string }) {
  const pixCode = React.useMemo(
    () =>
      `00020126360014BR.GOV.BCB.PIX0114+55119999999995204000053039865406${total.toFixed(2)}5802BR5913BISTRO AZUL LTDA6009SAO PAULO62070503${shortId}6304ABCD`,
    [total, shortId],
  );

  const copy = () => {
    navigator.clipboard?.writeText(pixCode);
    toast.success("Código Pix copiado");
  };

  return (
    <div className="w-full animate-fade-in rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-elevated)]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
        <QrIcon className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-xl font-bold">Aguardando pagamento Pix</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Escaneie o QR code no app do seu banco para pagar {brl(total)}.
      </p>

      <div className="mx-auto mt-6 grid h-56 w-56 place-items-center rounded-2xl border border-border bg-white p-3">
        <QrPattern />
      </div>

      <button
        onClick={copy}
        className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary-soft"
      >
        <Copy className="h-3.5 w-3.5" /> Copiar código Pix
      </button>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-foreground/60">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Aguardando confirmação do banco…
      </div>
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

/** Purely decorative QR-like pattern. */
function QrPattern() {
  const cells = React.useMemo(() => {
    const rng = mulberry32(42);
    return Array.from({ length: 21 * 21 }, (_, i) => {
      const x = i % 21;
      const y = Math.floor(i / 21);
      const inCorner =
        (x < 7 && y < 7) || (x >= 14 && y < 7) || (x < 7 && y >= 14);
      if (inCorner) {
        const cx = x < 7 ? 3 : 17;
        const cy = y < 7 ? 3 : 17;
        const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
        return d === 0 || d === 2 || d === 3;
      }
      return rng() > 0.55;
    });
  }, []);
  return (
    <div className="grid h-full w-full gap-[1px]" style={{ gridTemplateColumns: "repeat(21, 1fr)" }}>
      {cells.map((on, i) => (
        <div key={i} className={on ? "bg-foreground" : "bg-transparent"} />
      ))}
    </div>
  );
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
