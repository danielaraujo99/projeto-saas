import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminSession } from "@/lib/admin/session";
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  openTable,
  closeTable,
  transferTable,
  mergeTables,
  listTableItems,
  addTableItem,
  removeTableItem,
  type TableRow,
  type TableItem,
} from "@/lib/admin/tables";
import { listWaiters, type Waiter } from "@/lib/admin/waiters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { brl } from "@/lib/format";
import {
  Plus,
  Pencil,
  Users as UsersIcon,
  Printer,
  ArrowRightLeft,
  Merge,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { printHtml, buildTableCheckHtml, loadPrintSettings } from "@/lib/admin/printing";

export const Route = createFileRoute("/admin/mesas")({
  head: () => ({
    meta: [
      { title: "Mesas — Painel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MesasPage,
});

const GRID = 40;
const CANVAS_W = 900;
const CANVAS_H = 520;

function MesasPage() {
  const { data: session } = useAdminSession();
  const rid = session?.restaurantId;
  const qc = useQueryClient();

  const { data: tables, isLoading } = useQuery({
    queryKey: ["tables", rid],
    queryFn: () => listTables(rid!),
    enabled: !!rid,
    refetchInterval: 15_000,
  });
  const { data: waiters } = useQuery({
    queryKey: ["waiters", rid],
    queryFn: () => listWaiters(rid!),
    enabled: !!rid,
  });

  const [editMode, setEditMode] = React.useState(false);
  const [openNew, setOpenNew] = React.useState(false);
  const [selected, setSelected] = React.useState<TableRow | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<{ id: string; dx: number; dy: number } | null>(null);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["tables", rid] });
  }

  function onPointerDown(e: React.PointerEvent, t: TableRow) {
    if (!editMode) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id: t.id, dx: e.clientX - t.pos_x, dy: e.clientY - t.pos_y });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag || !tables) return;
    const t = tables.find((x) => x.id === drag.id);
    if (!t) return;
    const nx = Math.max(0, Math.min(CANVAS_W - 96, Math.round((e.clientX - drag.dx) / 8) * 8));
    const ny = Math.max(0, Math.min(CANVAS_H - 96, Math.round((e.clientY - drag.dy) / 8) * 8));
    // optimistic
    qc.setQueryData<TableRow[]>(["tables", rid], (old) =>
      (old ?? []).map((x) => (x.id === t.id ? { ...x, pos_x: nx, pos_y: ny } : x)),
    );
  }
  async function onPointerUp() {
    if (!drag || !tables) return;
    const t = tables.find((x) => x.id === drag.id);
    setDrag(null);
    if (!t) return;
    try {
      await updateTable(t.id, { pos_x: t.pos_x, pos_y: t.pos_y });
    } catch {
      toast.error("Falha ao salvar posição");
    }
  }

  return (
    <AdminShell title="Mesas">
      <div className="px-4 py-6 sm:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mapa do salão</h2>
            <p className="text-sm text-slate-500">
              Clique em uma mesa livre para abrir uma comanda ou em uma ocupada para operar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode((v) => !v)}
            >
              <Pencil className="h-4 w-4" /> {editMode ? "Concluir layout" : "Editar layout"}
            </Button>
            <Button onClick={() => setOpenNew(true)}>
              <Plus className="h-4 w-4" /> Nova mesa
            </Button>
          </div>
        </div>

        <Legend />

        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className={cn(
            "relative mt-4 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm",
            editMode && "cursor-grab",
          )}
          style={{
            backgroundImage:
              "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
            backgroundSize: `${GRID}px ${GRID}px`,
          }}
        >
          <div style={{ width: CANVAS_W, height: CANVAS_H, position: "relative" }}>
            {isLoading ? (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !tables || tables.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-slate-500">
                Nenhuma mesa cadastrada. Clique em "Nova mesa".
              </div>
            ) : (
              tables.map((t) => (
                <TableChip
                  key={t.id}
                  t={t}
                  editMode={editMode}
                  onPointerDown={(e) => onPointerDown(e, t)}
                  onClick={() => {
                    if (editMode) return;
                    if (t.status === "reserved") {
                      toast.info(
                        `Reservada${t.reservation_name ? ` para ${t.reservation_name}` : ""}`,
                      );
                      return;
                    }
                    setSelected(t);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <NewTableSheet
        open={openNew}
        onOpenChange={setOpenNew}
        restaurantId={rid}
        onSaved={refresh}
      />

      <TableActionSheet
        table={selected}
        allTables={tables ?? []}
        waiters={waiters ?? []}
        restaurantId={rid}
        onClose={() => setSelected(null)}
        onChanged={refresh}
      />
    </AdminShell>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
      <LegendDot cls="bg-emerald-500" label="Livre" />
      <LegendDot cls="bg-orange-500" label="Ocupada" />
      <LegendDot cls="bg-slate-300" label="Reservada" />
      <span className="ml-auto text-slate-400">
        Ative "Editar layout" para arrastar as mesas.
      </span>
    </div>
  );
}
function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", cls)} />
      {label}
    </span>
  );
}

function TableChip({
  t,
  editMode,
  onPointerDown,
  onClick,
}: {
  t: TableRow;
  editMode: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: () => void;
}) {
  const tone =
    t.status === "free"
      ? "bg-emerald-500 text-white ring-emerald-600 hover:bg-emerald-600"
      : t.status === "occupied"
        ? "bg-orange-500 text-white ring-orange-600 hover:bg-orange-600"
        : "bg-slate-200 text-slate-500 ring-slate-300 opacity-70 cursor-not-allowed";
  return (
    <button
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{ left: t.pos_x, top: t.pos_y, position: "absolute" }}
      className={cn(
        "grid h-24 w-24 select-none place-items-center rounded-2xl shadow-lg ring-2 transition-transform",
        editMode ? "cursor-grab active:scale-95" : "hover:scale-105",
        tone,
      )}
      aria-label={`Mesa ${t.number}`}
    >
      <div className="text-2xl font-black leading-none">{t.number}</div>
      <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-90">
        <UsersIcon className="h-3 w-3" />
        {t.seats}
      </div>
    </button>
  );
}

function NewTableSheet({
  open,
  onOpenChange,
  restaurantId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  restaurantId?: string;
  onSaved: () => void;
}) {
  const [num, setNum] = React.useState(1);
  const [seats, setSeats] = React.useState(4);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!restaurantId) return;
    setSaving(true);
    try {
      await createTable({
        restaurant_id: restaurantId,
        number: num,
        seats,
        pos_x: 40,
        pos_y: 40,
      });
      toast.success("Mesa criada");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Falha ao criar. Rode 'salao-setup.sql' no Supabase.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nova mesa</SheetTitle>
          <SheetDescription>Adicione ao mapa e arraste para posicionar.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-xs font-medium text-slate-600">
            <span>Número</span>
            <Input
              type="number"
              value={num}
              onChange={(e) => setNum(Number(e.target.value))}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-600">
            <span>Lugares</span>
            <Input
              type="number"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Criar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TableActionSheet({
  table,
  allTables,
  waiters,
  restaurantId,
  onClose,
  onChanged,
}: {
  table: TableRow | null;
  allTables: TableRow[];
  waiters: Waiter[];
  restaurantId?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [waiterId, setWaiterId] = React.useState<string>("");
  const [items, setItems] = React.useState<TableItem[]>([]);
  const [name, setName] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [price, setPrice] = React.useState(0);
  const [transferTo, setTransferTo] = React.useState<string>("");
  const [mergeTo, setMergeTo] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const isOpen = !!table;
  const occupied = table?.status === "occupied";

  React.useEffect(() => {
    if (!table) return;
    setWaiterId(table.waiter_id ?? "");
    setName("");
    setQty(1);
    setPrice(0);
    setTransferTo("");
    setMergeTo("");
    if (occupied) {
      listTableItems(table.id).then(setItems).catch(() => setItems([]));
    } else {
      setItems([]);
    }
  }, [table, occupied]);

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const waiter = waiters.find((w) => w.id === table?.waiter_id);
  const elapsed = table?.opened_at
    ? Math.floor((Date.now() - new Date(table.opened_at).getTime()) / 60000)
    : 0;

  async function doOpen() {
    if (!table) return;
    setLoading(true);
    try {
      await openTable(table.id, waiterId || null);
      toast.success(`Mesa ${table.number} aberta`);
      onChanged();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao abrir");
    } finally {
      setLoading(false);
    }
  }

  async function doAddItem() {
    if (!table || !restaurantId) return;
    if (!name.trim() || qty <= 0) return;
    try {
      await addTableItem({
        restaurant_id: restaurantId,
        table_id: table.id,
        name,
        qty,
        price,
      });
      const next = await listTableItems(table.id);
      setItems(next);
      setName("");
      setQty(1);
      setPrice(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao adicionar");
    }
  }

  async function doRemoveItem(id: string) {
    await removeTableItem(id);
    if (table) setItems(await listTableItems(table.id));
  }

  async function doPrint() {
    if (!table || !restaurantId) return;
    const cfg = await loadPrintSettings(restaurantId);
    const html = buildTableCheckHtml({
      title: `Mesa ${table.number}`,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total,
      settings: cfg,
    });
    printHtml(html);
  }

  async function doClose() {
    if (!table) return;
    setLoading(true);
    try {
      await closeTable(table.id);
      toast.success("Conta fechada");
      onChanged();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao fechar");
    } finally {
      setLoading(false);
    }
  }

  async function doTransfer() {
    if (!table || !transferTo) return;
    try {
      await transferTable(table.id, transferTo);
      toast.success("Transferida");
      onChanged();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao transferir");
    }
  }

  async function doMerge() {
    if (!table || !mergeTo) return;
    try {
      await mergeTables(table.id, mergeTo);
      toast.success("Mesas unificadas");
      onChanged();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao unificar");
    }
  }

  async function doDelete() {
    if (!table) return;
    await deleteTable(table.id);
    toast.success("Mesa removida");
    onChanged();
    onClose();
  }

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {table && (
          <>
            <SheetHeader>
              <SheetTitle>
                Mesa {table.number}
                <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {table.seats} lugares
                </span>
              </SheetTitle>
              <SheetDescription>
                {occupied
                  ? `Ocupada há ${elapsed} min${waiter ? ` · ${waiter.name}` : ""}`
                  : "Livre — abrir nova comanda"}
              </SheetDescription>
            </SheetHeader>

            {!occupied ? (
              <div className="mt-4 space-y-3">
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                  <span>Garçom responsável</span>
                  <Select value={waiterId} onValueChange={setWaiterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {waiters
                        .filter((w) => w.active)
                        .map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </label>
                <div className="flex justify-between gap-2 pt-2">
                  <Button variant="ghost" onClick={doDelete}>
                    <Trash2 className="h-4 w-4 text-red-500" /> Remover mesa
                  </Button>
                  <Button onClick={doOpen} disabled={loading}>
                    Abrir comanda
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Itens da comanda
                  </div>
                  {items.length === 0 ? (
                    <div className="py-3 text-center text-sm text-slate-400">
                      Nenhum item adicionado
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between gap-2 py-1.5 text-sm"
                        >
                          <span className="flex-1 truncate">
                            {it.qty}× {it.name}
                          </span>
                          <span className="tabular-nums text-slate-700">
                            {brl(it.qty * it.price)}
                          </span>
                          <button
                            onClick={() => doRemoveItem(it.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 flex items-end gap-2 border-t border-slate-100 pt-3">
                    <label className="flex-1 text-xs font-medium text-slate-600">
                      Item
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label className="w-16 text-xs font-medium text-slate-600">
                      Qtd
                      <Input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                      />
                    </label>
                    <label className="w-24 text-xs font-medium text-slate-600">
                      Preço
                      <Input
                        type="number"
                        step={0.1}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                      />
                    </label>
                    <Button size="sm" onClick={doAddItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="font-medium text-slate-600">Total parcial</span>
                    <span className="text-lg font-bold text-slate-900">{brl(total)}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Transferir
                    </div>
                    <Select value={transferTo} onValueChange={setTransferTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mesa livre" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTables
                          .filter((x) => x.id !== table.id && x.status === "free")
                          .map((x) => (
                            <SelectItem key={x.id} value={x.id}>
                              Mesa {x.number}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="mt-2 w-full"
                      variant="outline"
                      size="sm"
                      onClick={doTransfer}
                      disabled={!transferTo}
                    >
                      <ArrowRightLeft className="h-4 w-4" /> Transferir
                    </Button>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Juntar com
                    </div>
                    <Select value={mergeTo} onValueChange={setMergeTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mesa ocupada" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTables
                          .filter((x) => x.id !== table.id && x.status === "occupied")
                          .map((x) => (
                            <SelectItem key={x.id} value={x.id}>
                              Mesa {x.number}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="mt-2 w-full"
                      variant="outline"
                      size="sm"
                      onClick={doMerge}
                      disabled={!mergeTo}
                    >
                      <Merge className="h-4 w-4" /> Unificar
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3">
                  <Button variant="outline" onClick={doPrint}>
                    <Printer className="h-4 w-4" /> Imprimir conta
                  </Button>
                  <Button onClick={doClose} disabled={loading}>
                    Fechar conta
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
