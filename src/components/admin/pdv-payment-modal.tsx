import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import {
  Banknote,
  CreditCard,
  QrCode,
  Wallet,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createPixCharge,
  createPointPaymentIntent,
  getPaymentStatus,
  getPointIntentStatus,
  getMpConfig,
  type MpConfig,
  type PixCharge,
} from "@/lib/admin/mercadopago";
import { useAdminSession } from "@/lib/admin/session";

type Method = "pix" | "credit" | "debit" | "cash";

type Step =
  | { kind: "choose" }
  | { kind: "pix"; charge?: PixCharge; loading?: boolean; error?: string }
  | {
      kind: "card";
      variant: "credit" | "debit";
      phase: "insert" | "processing" | "done";
      intentId?: string;
      error?: string;
    }
  | { kind: "cash" }
  | { kind: "success"; method: Method };

export function PdvPaymentModal({
  open,
  onOpenChange,
  total,
  onConfirmed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onConfirmed: (method: Method) => void;
}) {
  const { data: session } = useAdminSession();
  const [step, setStep] = React.useState<Step>({ kind: "choose" });
  const [cash, setCash] = React.useState("");
  const [mp, setMp] = React.useState<MpConfig | null>(null);

  React.useEffect(() => {
    if (open) {
      setStep({ kind: "choose" });
      setCash("");
      if (session?.restaurantId) {
        getMpConfig(session.restaurantId).then((c) =>
          setMp(c && c.enabled && c.access_token ? c : null),
        );
      }
    }
  }, [open, session?.restaurantId]);

  /* ---------- PIX: cria charge quando entra na tela ---------- */
  React.useEffect(() => {
    if (step.kind !== "pix" || step.charge || step.loading || step.error) return;
    if (!mp) return; // Sem MP, usa fallback local (renderiza QR estático)
    setStep({ kind: "pix", loading: true });
    createPixCharge(mp, { amount: total, description: "Venda PDV MenuAltas" })
      .then((charge) => setStep({ kind: "pix", charge }))
      .catch((e) =>
        setStep({ kind: "pix", error: e instanceof Error ? e.message : "Falha ao gerar QR." }),
      );
  }, [step, mp, total]);

  /* ---------- PIX: polling de status ---------- */
  React.useEffect(() => {
    if (step.kind !== "pix" || !step.charge || !mp) return;
    const id = setInterval(async () => {
      try {
        const s = await getPaymentStatus(mp, step.charge!.id);
        if (s.status === "approved") {
          clearInterval(id);
          setStep({ kind: "success", method: "pix" });
          onConfirmed("pix");
        }
      } catch {
        // ignora
      }
    }, 3500);
    return () => clearInterval(id);
  }, [step, mp, onConfirmed]);

  /* ---------- Card: cria intent na maquininha, polling ---------- */
  React.useEffect(() => {
    if (step.kind !== "card" || step.phase !== "insert" || step.intentId) return;
    if (!mp || !mp.device_id) return; // Sem maquininha configurada, usa animação simulada
    createPointPaymentIntent(mp, {
      amount: total,
      type: step.variant === "debit" ? "debit_card" : "credit_card",
      description: "Venda PDV MenuAltas",
    })
      .then((r) =>
        setStep({ kind: "card", variant: step.variant, phase: "processing", intentId: r.id }),
      )
      .catch((e) =>
        setStep({
          kind: "card",
          variant: step.variant,
          phase: "insert",
          error: e instanceof Error ? e.message : "Falha ao enviar para a maquininha.",
        }),
      );
  }, [step, mp, total]);

  React.useEffect(() => {
    if (step.kind !== "card" || step.phase !== "processing") return;
    // Se tem MP + intent, faz polling real.
    if (mp && step.intentId) {
      const id = setInterval(async () => {
        try {
          const r = await getPointIntentStatus(mp, step.intentId!);
          const s = r?.state ?? r?.status;
          if (s === "FINISHED" || s === "PROCESSED" || s === "approved") {
            clearInterval(id);
            setStep({ kind: "card", variant: step.variant, phase: "done" });
            setTimeout(() => {
              setStep({ kind: "success", method: step.variant });
              onConfirmed(step.variant);
            }, 900);
          } else if (s === "CANCELED" || s === "ERROR" || s === "rejected") {
            clearInterval(id);
            setStep({
              kind: "card",
              variant: step.variant,
              phase: "insert",
              error: "Transação cancelada ou recusada.",
            });
          }
        } catch {
          // ignora
        }
      }, 2500);
      return () => clearInterval(id);
    }
    // Fallback: simulação
    const t = setTimeout(() => {
      setStep({ kind: "card", variant: step.variant, phase: "done" });
      setTimeout(() => {
        setStep({ kind: "success", method: step.variant });
        onConfirmed(step.variant);
      }, 900);
    }, 2200);
    return () => clearTimeout(t);
  }, [step, mp, onConfirmed]);

  const change = Math.max(0, (Number(cash.replace(",", ".")) || 0) - total);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step.kind !== "choose" && step.kind !== "success" ? (
              <button
                onClick={() => setStep({ kind: "choose" })}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
            {step.kind === "choose" && "Forma de pagamento"}
            {step.kind === "pix" && "Pagamento via PIX"}
            {step.kind === "card" && `Cartão de ${step.variant === "credit" ? "crédito" : "débito"}`}
            {step.kind === "cash" && "Pagamento em dinheiro"}
            {step.kind === "success" && "Pagamento aprovado"}
          </DialogTitle>
          <DialogDescription>
            Total: <span className="font-semibold text-slate-900">R$ {total.toFixed(2)}</span>
            {mp ? (
              <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                Mercado Pago {mp.sandbox ? "sandbox" : "live"}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {step.kind === "choose" && (
          <div className="grid grid-cols-2 gap-3">
            <MethodBtn
              icon={<QrCode className="h-6 w-6" />}
              label="PIX"
              hint={mp ? "QR gerado pelo MP" : "QR local"}
              onClick={() => setStep({ kind: "pix" })}
            />
            <MethodBtn
              icon={<CreditCard className="h-6 w-6" />}
              label="Crédito"
              hint={mp?.device_id ? "Envia p/ maquininha" : "Maquininha"}
              onClick={() => setStep({ kind: "card", variant: "credit", phase: "insert" })}
            />
            <MethodBtn
              icon={<Wallet className="h-6 w-6" />}
              label="Débito"
              hint={mp?.device_id ? "Envia p/ maquininha" : "Maquininha"}
              onClick={() => setStep({ kind: "card", variant: "debit", phase: "insert" })}
            />
            <MethodBtn
              icon={<Banknote className="h-6 w-6" />}
              label="Dinheiro"
              hint="Com troco"
              onClick={() => setStep({ kind: "cash" })}
            />
          </div>
        )}

        {step.kind === "pix" && (
          <div className="flex flex-col items-center gap-3 py-2">
            {step.loading && (
              <div className="grid h-52 w-52 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {step.error && (
              <div className="flex w-full items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">Falha ao gerar QR pelo Mercado Pago.</div>
                  <div className="mt-0.5">{step.error}</div>
                </div>
              </div>
            )}
            {!step.loading && !step.error && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                {step.charge?.qr_code ? (
                  <QRCodeSVG
                    value={step.charge.qr_code}
                    size={220}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="M"
                  />
                ) : (
                  <QRCodeSVG
                    value={`pix:menualtas|valor:${total.toFixed(2)}|txid:${Date.now()}`}
                    size={220}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="M"
                  />
                )}
              </div>
            )}
            <p className="text-center text-xs text-slate-500">
              {mp
                ? "Aguardando pagamento… A confirmação chega automaticamente."
                : "Configure o Mercado Pago em Configurações → Integrações para QR real."}
            </p>
            {step.charge?.qr_code && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(step.charge!.qr_code);
                  toast.success("Código PIX copiado.");
                }}
              >
                Copiar código PIX
              </Button>
            )}
            <Button
              className="w-full"
              onClick={() => {
                setStep({ kind: "success", method: "pix" });
                onConfirmed("pix");
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Confirmar manualmente
            </Button>
          </div>
        )}

        {step.kind === "card" && step.phase === "insert" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <PosMachine phase="waiting" />
            <p className="text-center text-sm font-medium text-slate-700">
              {mp?.device_id
                ? "Enviando para a maquininha… Peça ao cliente para inserir ou aproximar o cartão."
                : "Insira, aproxime ou passe o cartão na maquininha"}
            </p>
            {step.error && (
              <div className="w-full rounded-lg border border-rose-200 bg-rose-50 p-2 text-center text-xs text-rose-700">
                {step.error}
              </div>
            )}
            {!mp?.device_id && (
              <Button
                className="w-full"
                onClick={() =>
                  setStep({ kind: "card", variant: step.variant, phase: "processing" })
                }
              >
                Simular leitura do cartão
              </Button>
            )}
          </div>
        )}

        {step.kind === "card" && step.phase === "processing" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <PosMachine phase="processing" />
            <p className="text-center text-sm font-medium text-slate-700">
              <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />
              Processando transação com a operadora…
            </p>
          </div>
        )}

        {step.kind === "card" && step.phase === "done" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <PosMachine phase="approved" />
            <p className="text-center text-sm font-semibold text-emerald-600">
              Transação aprovada
            </p>
          </div>
        )}

        {step.kind === "cash" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Valor recebido em dinheiro
              </label>
              <Input
                autoFocus
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Troco</span>
                <span className="font-bold text-slate-900">R$ {change.toFixed(2)}</span>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!cash || Number(cash.replace(",", ".")) < total}
              onClick={() => {
                setStep({ kind: "success", method: "cash" });
                onConfirmed("cash");
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Confirmar pagamento
            </Button>
          </div>
        )}

        {step.kind === "success" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-center text-lg font-bold text-slate-900">Venda finalizada</p>
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                toast.success("Cupom enviado para impressão");
              }}
            >
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MethodBtn({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <div className="text-sm font-bold text-slate-900">{label}</div>
        <div className="text-xs text-slate-500">{hint}</div>
      </div>
    </button>
  );
}

function PosMachine({ phase }: { phase: "waiting" | "processing" | "approved" }) {
  return (
    <div className="relative">
      <div
        className={cn(
          "relative h-44 w-32 rounded-2xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 p-2 shadow-xl transition-transform",
          phase === "processing" && "animate-[wiggle_0.6s_ease-in-out_infinite]",
        )}
      >
        <div
          className={cn(
            "h-16 rounded-md border border-slate-950 p-1.5 text-[10px] font-mono transition-colors",
            phase === "waiting" && "bg-emerald-950/60 text-emerald-300",
            phase === "processing" && "bg-amber-950/60 text-amber-300",
            phase === "approved" && "bg-emerald-500 text-slate-900",
          )}
        >
          {phase === "waiting" && (
            <>
              <div>MENU ALTAS</div>
              <div className="mt-1">INSIRA O</div>
              <div>CARTAO</div>
            </>
          )}
          {phase === "processing" && (
            <>
              <div>PROCESSANDO</div>
              <div className="mt-1 animate-pulse">■ ■ ■</div>
            </>
          )}
          {phase === "approved" && (
            <>
              <div className="font-bold">APROVADO</div>
              <div className="mt-1">✓</div>
            </>
          )}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-4 rounded-sm bg-slate-700" />
          ))}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-slate-950" />
        {phase === "waiting" && (
          <div className="absolute -bottom-8 left-1/2 h-10 w-20 -translate-x-1/2 animate-[insert_1.6s_ease-in-out_infinite] rounded-md bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
            <div className="mx-1 mt-1 h-2 w-4 rounded-sm bg-yellow-300/80" />
          </div>
        )}
      </div>
      <style>{`
        @keyframes insert {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -14px); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-1deg); }
          75% { transform: rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
