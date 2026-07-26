import * as React from "react";
import { X } from "lucide-react";
import type { CartCustomization, CartItem, Product } from "@/types";
import { brl } from "@/lib/format";
import { QuantityStepper } from "@/components/quantity-stepper";
import { AdaptiveSheet } from "@/components/adaptive-sheet";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  product: Product | null;
  editingItem?: CartItem | null;
  onClose: () => void;
};

export function ProductSheet({ product, editingItem, onClose }: Props) {
  const addItem = useCart((s) => s.addItem);
  const updateItem = useCart((s) => s.updateItem);
  const open = !!product;

  const [selections, setSelections] = React.useState<Record<string, CartCustomization[]>>({});
  const [quantity, setQuantity] = React.useState(1);
  const [note, setNote] = React.useState("");
  const [triedSubmit, setTriedSubmit] = React.useState(false);

  React.useEffect(() => {
    if (!product) return;
    if (editingItem) {
      const grouped: Record<string, CartCustomization[]> = {};
      editingItem.customizations.forEach((c) => {
        grouped[c.groupId] = [...(grouped[c.groupId] ?? []), c];
      });
      setSelections(grouped);
      setQuantity(editingItem.quantity);
      setNote(editingItem.note ?? "");
    } else {
      setSelections({});
      setQuantity(1);
      setNote("");
    }
    setTriedSubmit(false);
  }, [product, editingItem]);

  if (!product) return null;

  const groups = product.customizations ?? [];
  const flat = Object.values(selections).flat();
  const extras = flat.reduce((s, c) => s + c.priceDelta, 0);
  const total = (product.price + extras) * quantity;

  const isGroupValid = (g: (typeof groups)[number]) => {
    const n = (selections[g.id] ?? []).length;
    return n >= g.min && n <= g.max;
  };
  const allValid = groups.every(isGroupValid);

  const toggleOption = (groupId: string, opt: CartCustomization, max: number) => {
    setSelections((prev) => {
      const cur = prev[groupId] ?? [];
      const exists = cur.find((c) => c.optionId === opt.optionId);
      if (max === 1) return { ...prev, [groupId]: exists ? [] : [opt] };
      if (exists) return { ...prev, [groupId]: cur.filter((c) => c.optionId !== opt.optionId) };
      if (cur.length >= max) return prev;
      return { ...prev, [groupId]: [...cur, opt] };
    });
  };

  const submit = () => {
    setTriedSubmit(true);
    if (!allValid) return;
    const cs = flat;
    if (editingItem) {
      updateItem(editingItem.id, {
        customizations: cs,
        quantity,
        note,
      });
      toast.success("Item atualizado");
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        image: product.image,
        basePrice: product.price,
        quantity,
        note,
        customizations: cs,
      });
      toast.success("Adicionado ao carrinho");
    }
    onClose();
  };

  return (
    <AdaptiveSheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={product.name}
      size="lg"
    >
      <div className="relative shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/10] w-full bg-muted" />
        )}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/95 text-foreground shadow-md hover:bg-background"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-2 text-lg font-bold text-foreground tabular-nums">
          {brl(product.price)}
        </div>

        {groups.map((g) => {
          const selected = selections[g.id] ?? [];
          const showError = triedSubmit && !isGroupValid(g);
          return (
            <section key={g.id} className="mt-6">
              <header className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{g.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {g.min === g.max
                      ? g.min === 1
                        ? "Escolha 1 opção"
                        : `Escolha ${g.min}`
                      : g.min === 0
                        ? `Até ${g.max}`
                        : `De ${g.min} a ${g.max}`}
                  </p>
                </div>
                {g.required ? (
                  <span className="rounded-full bg-foreground/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                    Obrigatório
                  </span>
                ) : null}
              </header>
              <div className="mt-2 space-y-1">
                {g.options.map((opt) => {
                  const active = selected.some((c) => c.optionId === opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
                        active
                          ? "border-primary bg-primary-soft"
                          : "border-transparent hover:bg-surface",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type={g.max === 1 ? "radio" : "checkbox"}
                          name={g.id}
                          checked={active}
                          onChange={() =>
                            toggleOption(
                              g.id,
                              {
                                groupId: g.id,
                                groupName: g.name,
                                optionId: opt.id,
                                optionName: opt.name,
                                priceDelta: opt.priceDelta,
                              },
                              g.max,
                            )
                          }
                          className="h-4 w-4 accent-[color:var(--primary)]"
                        />
                        <span className="text-sm text-foreground">{opt.name}</span>
                      </div>
                      {opt.priceDelta > 0 ? (
                        <span className="text-sm font-medium text-primary tabular-nums">
                          + {brl(opt.priceDelta)}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
              {showError ? (
                <p className="mt-1 text-xs text-destructive">
                  {g.min === g.max
                    ? `Selecione ${g.min} opção${g.min > 1 ? "es" : ""}.`
                    : `Selecione entre ${g.min} e ${g.max} opções.`}
                </p>
              ) : null}
            </section>
          );
        })}

        <section className="mt-6">
          <label className="text-sm font-semibold text-foreground">Alguma observação?</label>
          <p className="text-xs text-muted-foreground">Ex: sem cebola, ponto da carne…</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="Escreva aqui…"
            className="mt-2 resize-none"
            rows={3}
          />
        </section>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <QuantityStepper value={quantity} onChange={setQuantity} min={1} />
          <Button
            onClick={submit}
            size="lg"
            className="h-12 flex-1 rounded-full text-base font-semibold"
          >
            <span>{editingItem ? "Atualizar" : "Adicionar"}</span>
            <span className="ml-auto tabular-nums">{brl(total)}</span>
          </Button>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
