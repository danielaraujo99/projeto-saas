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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Method = "pix" | "credit" | "debit" | "cash";
type Step =
  | { kind: "choose" }
  | { kind: "pix" }
  | { kind: "card"; variant: "credit" | "debit"; phase: "insert" | "processing" | "done" }
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
  const [step, setStep] = React.useState<Step>({ kind: "choose" });
  const [cash, setCash] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setStep({ kind: "choose" });
      setCash("");
    }
  }, [open]);

  React.useEffect(() => {
    if (step.kind !== "card" || step.phase !== "processing") return;
    const t = setTimeout(() => {
      setStep({ kind: "card", variant: step.variant, phase: "done" });
      setTimeout(() => {
        setStep({ kind: "success", method: step.variant });
        onConfirmed(step.variant);
      }, 900);
    }, 2200);
    return () => clearTimeout(t);
  }, [step, onConfirmed]);

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
          </DialogDescription>
        </DialogHeader>

        {step.kind === "choose" && (
          <div className="grid grid-cols-2 gap-3">
            <MethodBtn
              icon={<QrCode className="h-6 w-6" />}
              label="PIX"
              hint="QR Code instantâneo"
              onClick={() => setStep({ kind: "pix" })}
            />
            <MethodBtn
              icon={<CreditCard className="h-6 w-6" />}
              label="Crédito"
              hint="Maquininha"
              onClick={() => setStep({ kind: "card", variant: "credit", phase: "insert" })}
            />
            <MethodBtn
              icon={<Wallet className="h-6 w-6" />}
              label="Débito"
              hint="Maquininha"
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
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <QRCodeSVG
                value={`pix:menualtas|valor:${total.toFixed(2)}|txid:${Date.now()}`}
                size={200}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
              />
            </div>
            <p className="text-center text-xs text-slate-500">
              Peça ao cliente para escanear o QR no app do banco.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                setStep({ kind: "success", method: "pix" });
                onConfirmed("pix");
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Confirmar recebimento
            </Button>
          </div>
        )}

        {step.kind === "card" && step.phase === "insert" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <PosMachine phase="waiting" />
            <p className="text-center text-sm font-medium text-slate-700">
              Insira, aproxime ou passe o cartão na maquininha
            </p>
            <Button
              className="w-full"
              onClick={() =>
                setStep({ kind: "card", variant: step.variant, phase: "processing" })
              }
            >
              Simular leitura do cartão
            </Button>
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
            <p className="text-center text-lg font-bold text-slate-900">
              Venda finalizada
            </p>
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
        {/* screen */}
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
        {/* keypad */}
        <div className="mt-2 grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-4 rounded-sm bg-slate-700" />
          ))}
        </div>
        {/* card slot */}
        <div className="absolute -bottom-1 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-slate-950" />
        {/* card animation */}
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
