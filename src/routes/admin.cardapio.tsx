import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { MENU_CATEGORIES, MENU_ITEMS } from "@/lib/admin/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cardapio")({
  head: () => ({ meta: [{ title: "Cardápio — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: CardapioPage,
});

function CardapioPage() {
  const [tab, setTab] = React.useState<"itens" | "categorias">("itens");
  const [q, setQ] = React.useState("");
  const [openItem, setOpenItem] = React.useState(false);
  const [openCat, setOpenCat] = React.useState(false);
  const [delId, setDelId] = React.useState<string | null>(null);
  const items = MENU_ITEMS.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminShell title="Cardápio">
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Cardápio</h2>
            <p className="text-sm text-slate-500">Gerencie categorias e produtos.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenCat(true)}>
              <Tag className="h-4 w-4" /> Nova categoria
            </Button>
            <Button onClick={() => setOpenItem(true)}>
              <Plus className="h-4 w-4" /> Novo produto
            </Button>
          </div>
        </div>

        <div className="mt-5 inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-sm">
          {(["itens", "categorias"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 font-medium capitalize transition ${
                tab === t ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "itens" ? "Produtos" : "Categorias"}
            </button>
          ))}
        </div>

        {tab === "itens" ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar produto…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Produto</th>
                    <th className="px-4 py-3 font-semibold">Categoria</th>
                    <th className="px-4 py-3 font-semibold">Preço</th>
                    <th className="px-4 py-3 font-semibold">Estoque</th>
                    <th className="px-4 py-3 font-semibold">Ativo</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((i) => (
                    <tr key={i.id} className="bg-white text-slate-800 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-lg">
                            {i.emoji}
                          </span>
                          <span className="font-medium text-slate-900">{i.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{i.cat}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">R$ {i.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">{i.stock}</td>
                      <td className="px-4 py-3">
                        <Switch defaultChecked={i.active} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="mr-1 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          onClick={() => setOpenItem(true)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDelId(i.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MENU_CATEGORIES.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.items} produtos</div>
                  </div>
                  <Switch defaultChecked={c.active} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setOpenCat(true)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDelId(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ItemSheet open={openItem} onOpenChange={setOpenItem} />
      <CategoryDialog open={openCat} onOpenChange={setOpenCat} />
      <AlertDialog open={!!delId} onOpenChange={(v) => !v && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.success("Item excluído");
                setDelId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

function ItemSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo produto</SheetTitle>
          <SheetDescription>Cadastre um item do cardápio.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid gap-3">
          <Field label="Nome"><Input placeholder="Ex.: X-Salada" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm">
                {MENU_CATEGORIES.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Preço (R$)"><Input type="number" placeholder="0,00" /></Field>
          </div>
          <Field label="Descrição">
            <textarea
              className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white p-2 text-sm"
              placeholder="Ingredientes e detalhes…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estoque inicial"><Input type="number" placeholder="0" /></Field>
            <Field label="Tempo de preparo (min)"><Input type="number" placeholder="15" /></Field>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <div className="text-sm font-semibold text-slate-800">Produto ativo</div>
              <div className="text-xs text-slate-500">Fica visível no cardápio online</div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
        <SheetFooter className="mt-6 flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              toast.success("Produto salvo");
              onOpenChange(false);
            }}
          >
            Salvar produto
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CategoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>Agrupe produtos do cardápio.</DialogDescription>
        </DialogHeader>
        <Field label="Nome"><Input placeholder="Ex.: Sobremesas" /></Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { toast.success("Categoria salva"); onOpenChange(false); }}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}
