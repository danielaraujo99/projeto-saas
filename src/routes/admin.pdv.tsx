import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { MENU_ITEMS } from "@/lib/admin/mock-data";
import { Search, Plus, Minus, Trash2, DollarSign, ArrowDownCircle, ArrowUpCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pdv")({
  head: () => ({ meta: [{ title: "PDV — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: PdvPage,
});

type Line = { id: string; name: string; price: number; qty: number };

function PdvPage() {
  const [query, setQuery] = React.useState("");
  const [cart, setCart] = React.useState<Line[]>([
    { id: "1", name: "X-Burger", price: 28.9, qty: 2 },
    { id: "5", name: "Coca-Cola 350ml", price: 7.5, qty: 2 },
  ]);
  const [openDialog, setOpenDialog] = React.useState<null | "open" | "close" | "sangria" | "supri">(null);
  const [cashOpen, setCashOpen] = React.useState(true);

  const filtered = MENU_ITEMS.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
  const subtotal = cart.reduce((a, b) => a + b.price * b.qty, 0);

  function add(item: (typeof MENU_ITEMS)[number]) {
    setCart((c) => {
      const ex = c.find((x) => x.id === item.id);
      if (ex) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }

  return (
    <AdminShell title="PDV (Caixa)">
      <div className="grid gap-4 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_400px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Frente de caixa</h2>
              <p className="text-xs text-slate-500">
                Caixa {cashOpen ? "aberto" : "fechado"} · Turno de hoje
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!cashOpen ? (
                <Button size="sm" onClick={() => setOpenDialog("open")}>
                  <Lock className="h-4 w-4" /> Abrir caixa
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setOpenDialog("sangria")}>
                    <ArrowUpCircle className="h-4 w-4" /> Sangria
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOpenDialog("supri")}>
                    <ArrowDownCircle className="h-4 w-4" /> Suprimento
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setOpenDialog("close")}>
                    Fechar caixa
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar produto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((it) => (
              <button
                key={it.id}
                onClick={() => add(it)}
                className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-primary/40 hover:shadow-md"
              >
                <span className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-xl">
                  {it.emoji}
                </span>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-primary">
                  {it.name}
                </span>
                <span className="mt-0.5 text-xs text-slate-500">{it.cat}</span>
                <span className="mt-2 text-sm font-bold text-slate-900">
                  R$ {it.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20 lg:self-start">
          <h3 className="text-sm font-bold text-slate-900">Comanda #4212</h3>
          {cart.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Adicione produtos para começar.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {cart.map((l) => (
                <li key={l.id} className="rounded-lg border border-slate-100 p-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{l.name}</span>
                    <button
                      onClick={() => setCart((c) => c.filter((x) => x.id !== l.id))}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border border-slate-200">
                      <button
                        onClick={() =>
                          setCart((c) =>
                            c.map((x) =>
                              x.id === l.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x,
                            ),
                          )
                        }
                        className="px-2 py-1 text-slate-500 hover:bg-slate-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[28px] px-2 text-center text-xs font-semibold">
                        {l.qty}
                      </span>
                      <button
                        onClick={() =>
                          setCart((c) =>
                            c.map((x) => (x.id === l.id ? { ...x, qty: x.qty + 1 } : x)),
                          )
                        }
                        className="px-2 py-1 text-slate-500 hover:bg-slate-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      R$ {(l.price * l.qty).toFixed(2)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
            <Row label="Subtotal" value={subtotal} />
            <Row label="Desconto" value={0} />
            <Row label="Total" value={subtotal} bold />
          </div>
          <Button
            className="mt-4 w-full"
            disabled={cart.length === 0}
            onClick={() => {
              toast.success("Venda finalizada com sucesso");
              setCart([]);
            }}
          >
            <DollarSign className="h-4 w-4" /> Finalizar venda
          </Button>
        </aside>
      </div>

      <Dialog open={!!openDialog} onOpenChange={(v) => !v && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {openDialog === "open" && "Abrir caixa"}
              {openDialog === "close" && "Fechar caixa"}
              {openDialog === "sangria" && "Registrar sangria"}
              {openDialog === "supri" && "Registrar suprimento"}
            </DialogTitle>
            <DialogDescription>
              {openDialog === "close"
                ? "Confirme o valor em dinheiro em caixa para conferência."
                : "Informe o valor da operação."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Valor (R$)</label>
            <Input type="number" placeholder="0,00" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (openDialog === "open") setCashOpen(true);
                if (openDialog === "close") setCashOpen(false);
                toast.success("Operação registrada");
                setOpenDialog(null);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-base font-bold text-slate-900" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>R$ {value.toFixed(2)}</span>
    </div>
  );
}
