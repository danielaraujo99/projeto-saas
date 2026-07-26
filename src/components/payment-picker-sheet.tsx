import * as React from "react";
import { QrCode, CreditCard, Wallet, Check, ChevronRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { AdaptiveSheet } from "@/components/adaptive-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCards, type SavedCard } from "@/store/cards";
import type { PaymentMethod } from "@/types";

const brands = [
  { name: "Visa", re: /^4/ },
  { name: "Mastercard", re: /^(5[1-5]|2[2-7])/ },
  { name: "Amex", re: /^3[47]/ },
  { name: "Elo", re: /^(4011|4312|4389|4514|4573|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/ },
];

export function detectBrand(num: string) {
  const clean = num.replace(/\D/g, "");
  return brands.find((b) => b.re.test(clean))?.name ?? "Cartão";
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

type View = "root" | "card-list" | "card-new";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: PaymentMethod;
  onChange: (p: PaymentMethod) => void;
};

export function PaymentPickerSheet({ open, onOpenChange, value, onChange }: Props) {
  const [view, setView] = React.useState<View>("root");
  React.useEffect(() => {
    if (open) setView("root");
  }, [open]);

  const close = () => onOpenChange(false);
  const cards = useCards((s) => s.cards);

  const title =
    view === "root" ? "Forma de pagamento" : view === "card-list" ? "Cartão" : "Adicionar cartão";

  return (
    <AdaptiveSheet open={open} onOpenChange={onOpenChange} title={title} size="lg">
      <SheetHeader
        title={title}
        onBack={view !== "root" ? () => setView(view === "card-new" ? "card-list" : "root") : undefined}
        onClose={close}
      />
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        {view === "root" ? (
          <RootView
            value={value}
            onPickPix={() => {
              onChange({ kind: "pix" });
              close();
            }}
            onPickCash={() => {
              onChange({ kind: "cash" });
              close();
            }}
            onPickCard={() => setView(cards.length ? "card-list" : "card-new")}
          />
        ) : view === "card-list" ? (
          <CardListView
            value={value}
            onSelect={(c) => {
              onChange({ kind: c.kind, cardId: c.id, brand: c.brand, last4: c.last4 });
              close();
            }}
            onNew={() => setView("card-new")}
          />
        ) : (
          <NewCardView
            onSaved={(m) => {
              onChange(m);
              close();
            }}
          />
        )}
      </div>
    </AdaptiveSheet>
  );
}

function SheetHeader({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <div className="w-9" />
      )}
      <h2 className="min-w-0 flex-1 truncate text-center text-base font-bold text-foreground">
        {title}
      </h2>
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="grid h-9 w-9 place-items-center rounded-full text-xl font-medium hover:bg-surface"
      >
        ×
      </button>
    </div>
  );
}

function OptionRow({
  active,
  icon,
  title,
  subtitle,
  onClick,
  trailing,
}: {
  active?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3.5 text-left transition-all",
        active
          ? "border-primary bg-primary-soft shadow-[var(--shadow-card)] ring-2 ring-primary/20"
          : "border-border hover:border-primary/40 hover:bg-surface",
      )}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="truncate text-xs text-foreground/55">{subtitle}</div>
      </div>
      {trailing ?? (
        <div
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
            active ? "border-primary bg-primary" : "border-border",
          )}
        >
          {active ? <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} /> : null}
        </div>
      )}
    </button>
  );
}

function RootView({
  value,
  onPickPix,
  onPickCash,
  onPickCard,
}: {
  value: PaymentMethod;
  onPickPix: () => void;
  onPickCash: () => void;
  onPickCard: () => void;
}) {
  const isCard = value.kind === "credit" || value.kind === "debit";
  return (
    <div className="space-y-2.5">
      <OptionRow
        active={value.kind === "pix"}
        icon={<QrCode className="h-5 w-5" />}
        title="Pix"
        subtitle="Aprovação instantânea"
        onClick={onPickPix}
      />
      <OptionRow
        active={isCard}
        icon={<CreditCard className="h-5 w-5" />}
        title="Cartão"
        subtitle={isCard ? `${value.brand} •••• ${value.last4}` : "Crédito ou débito"}
        onClick={onPickCard}
        trailing={<ChevronRight className="h-5 w-5 text-foreground/40" />}
      />
      <OptionRow
        active={value.kind === "cash"}
        icon={<Wallet className="h-5 w-5" />}
        title="Dinheiro"
        subtitle="Pague na entrega"
        onClick={onPickCash}
      />
    </div>
  );
}

function CardListView({
  value,
  onSelect,
  onNew,
}: {
  value: PaymentMethod;
  onSelect: (c: SavedCard) => void;
  onNew: () => void;
}) {
  const cards = useCards((s) => s.cards);
  const remove = useCards((s) => s.remove);
  const activeId = value.kind === "credit" || value.kind === "debit" ? value.cardId : undefined;
  return (
    <div className="space-y-2.5">
      {cards.map((c) => {
        const active = c.id === activeId;
        return (
          <div
            key={c.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3.5 transition-all",
              active ? "border-primary bg-primary-soft ring-2 ring-primary/20" : "border-border",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(c)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {c.brand} •••• {c.last4}
                </div>
                <div className="truncate text-xs text-foreground/55">
                  {c.kind === "credit" ? "Crédito" : "Débito"} · {c.holder}
                </div>
              </div>
              <div
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                  active ? "border-primary bg-primary" : "border-border",
                )}
              >
                {active ? <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} /> : null}
              </div>
            </button>
            <button
              type="button"
              onClick={() => remove(c.id)}
              aria-label="Remover cartão"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground/50 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onNew}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card px-4 py-3.5 text-left transition-all hover:border-primary hover:bg-primary-soft"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Plus className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold text-primary">Adicionar novo cartão</div>
      </button>
    </div>
  );
}

function CardVisual({
  number,
  name,
  expiry,
  cvv,
  flipped,
  brand,
}: {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  flipped: boolean;
  brand: string;
}) {
  const display = (number || "•••• •••• •••• ••••").padEnd(19, "•");
  return (
    <div className="mx-auto w-full max-w-sm" style={{ perspective: "1200px" }}>
      <div className={cn("card3d relative aspect-[1.6/1] w-full", flipped && "card3d-flipped")}>
        {/* Front */}
        <div className="card3d-face absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[oklch(0.42_0.18_258)] p-5 text-primary-foreground shadow-[var(--shadow-elevated)]">
          <div className="flex items-start justify-between">
            <div className="h-8 w-11 rounded-md bg-primary-foreground/30 shadow-inner" />
            <span className="text-sm font-bold tracking-wide">{brand}</span>
          </div>
          <div className="font-mono text-lg tracking-[0.18em] tabular-nums">{display}</div>
          <div className="flex items-end justify-between gap-3 text-[10px] uppercase tracking-wider">
            <div className="min-w-0">
              <div className="opacity-70">Titular</div>
              <div className="truncate text-xs font-semibold uppercase tracking-wider">
                {name || "Nome no cartão"}
              </div>
            </div>
            <div className="text-right">
              <div className="opacity-70">Validade</div>
              <div className="text-xs font-semibold tabular-nums">{expiry || "MM/AA"}</div>
            </div>
          </div>
        </div>
        {/* Back */}
        <div className="card3d-face card3d-back absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[oklch(0.42_0.18_258)] shadow-[var(--shadow-elevated)]">
          <div className="mt-6 h-10 w-full bg-black/60" />
          <div className="mt-4 flex items-center gap-3 px-5">
            <div className="h-9 flex-1 rounded bg-primary-foreground/85" />
            <div className="grid h-9 min-w-14 place-items-center rounded bg-primary-foreground px-2 font-mono text-sm font-bold tabular-nums text-primary">
              {cvv || "•••"}
            </div>
          </div>
          <div className="mt-3 px-5 text-[10px] uppercase tracking-wider text-primary-foreground/70">
            CVV
          </div>
        </div>
      </div>
    </div>
  );
}

function NewCardView({ onSaved }: { onSaved: (m: PaymentMethod) => void }) {
  const [number, setNumber] = React.useState("");
  const [name, setName] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvv, setCvv] = React.useState("");
  const [kind, setKind] = React.useState<"credit" | "debit">("credit");
  const [save, setSave] = React.useState(true);
  const [flipped, setFlipped] = React.useState(false);
  const add = useCards((s) => s.add);

  const brand = detectBrand(number);
  const cleanNumber = number.replace(/\D/g, "");
  const last4 = cleanNumber.slice(-4);
  const valid =
    cleanNumber.length >= 13 && name.trim().length >= 3 && expiry.length === 5 && cvv.length >= 3;

  const submit = () => {
    if (!valid) return;
    const payment: PaymentMethod = {
      kind,
      cardId: "temp",
      brand,
      last4,
    };
    if (save) {
      const c = add({ brand, last4, holder: name.trim(), expiry, kind });
      payment.cardId = c.id;
    } else {
      payment.cardId = `once-${last4}`;
    }
    onSaved(payment);
  };

  return (
    <div className="space-y-5">
      <CardVisual
        number={number}
        name={name}
        expiry={expiry}
        cvv={cvv}
        flipped={flipped}
        brand={brand}
      />

      <div className="flex gap-2">
        {(["credit", "debit"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setKind(m)}
            className={cn(
              "flex-1 rounded-full border-2 px-3 py-2 text-xs font-semibold transition-colors",
              kind === m
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-foreground/60 hover:bg-surface",
            )}
          >
            {m === "credit" ? "Crédito" : "Débito"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <Field label="Número do cartão">
          <Input
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            value={number}
            onChange={(e) => setNumber(formatCardNumber(e.target.value))}
            onFocus={() => setFlipped(false)}
          />
        </Field>
        <Field label="Nome impresso no cartão">
          <Input
            placeholder="Como está no cartão"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            onFocus={() => setFlipped(false)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Validade">
            <Input
              placeholder="MM/AA"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              onFocus={() => setFlipped(false)}
            />
          </Field>
          <Field label="CVV">
            <Input
              placeholder="000"
              inputMode="numeric"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onFocus={() => setFlipped(true)}
              onBlur={() => setFlipped(false)}
            />
          </Field>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <span
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
            save ? "border-primary bg-primary" : "border-border bg-background",
          )}
          onClick={(e) => {
            e.preventDefault();
            setSave((s) => !s);
          }}
        >
          {save ? <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} /> : null}
        </span>
        <input
          type="checkbox"
          className="hidden"
          checked={save}
          onChange={(e) => setSave(e.target.checked)}
        />
        <span className="text-sm text-foreground">Salvar este cartão para próximas compras</span>
      </label>

      <Button
        onClick={submit}
        disabled={!valid}
        size="lg"
        className="h-12 w-full rounded-full text-base font-semibold shadow-[var(--shadow-elevated)]"
      >
        Usar este cartão
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-foreground/70">{label}</span>
      {children}
    </label>
  );
}
