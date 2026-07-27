import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
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
  Save,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/admin/mesas")({
  head: () => ({
    meta: [
      { title: "Mesas — Painel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MesasPage,
});

/* ============= MOCK DATA (temporário) ============= */
type MockStatus = "free" | "occupied" | "reserved";
type MockTable = {
  id: string;
  number: number;
  seats: number;
  status: MockStatus;
  pos_x: number;
  pos_y: number;
  waiter_id: string | null;
  opened_at: string | null;
  reservation_name: string | null;
};
type MockItem = { id: string; table_id: string; name: string; qty: number; price: number };
type MockWaiter = { id: string; name: string; active: boolean };

const MOCK_WAITERS: MockWaiter[] = [
  { id: "w1", name: "Carla Souza", active: true },
  { id: "w2", name: "Roberto Alves", active: true },
  { id: "w3", name: "Amanda Lima", active: true },
  { id: "w4", name: "Diego Martins", active: true },
];

const now = Date.now();
const initialMockTables: MockTable[] = [
  { id: "t1", number: 1, seats: 2, status: "occupied", pos_x: 40, pos_y: 40, waiter_id: "w1", opened_at: new Date(now - 42 * 60_000).toISOString(), reservation_name: null },
  { id: "t2", number: 2, seats: 4, status: "free", pos_x: 200, pos_y: 40, waiter_id: null, opened_at: null, reservation_name: null },
  { id: "t3", number: 3, seats: 4, status: "occupied", pos_x: 360, pos_y: 40, waiter_id: "w2", opened_at: new Date(now - 18 * 60_000).toISOString(), reservation_name: null },
  { id: "t4", number: 4, seats: 6, status: "reserved", pos_x: 520, pos_y: 40, waiter_id: null, opened_at: null, reservation_name: "Família Pereira · 20h30" },
  { id: "t5", number: 5, seats: 2, status: "free", pos_x: 680, pos_y: 40, waiter_id: null, opened_at: null, reservation_name: null },
  { id: "t6", number: 6, seats: 4, status: "occupied", pos_x: 40, pos_y: 200, waiter_id: "w3", opened_at: new Date(now - 75 * 60_000).toISOString(), reservation_name: null },
  { id: "t7", number: 7, seats: 4, status: "free", pos_x: 200, pos_y: 200, waiter_id: null, opened_at: null, reservation_name: null },
  { id: "t8", number: 8, seats: 8, status: "occupied", pos_x: 360, pos_y: 200, waiter_id: "w4", opened_at: new Date(now - 32 * 60_000).toISOString(), reservation_name: null },
  { id: "t9", number: 9, seats: 2, status: "free", pos_x: 520, pos_y: 200, waiter_id: null, opened_at: null, reservation_name: null },
  { id: "t10", number: 10, seats: 4, status: "reserved", pos_x: 680, pos_y: 200, waiter_id: null, opened_at: null, reservation_name: "João · 21h" },
  { id: "t11", number: 11, seats: 4, status: "free", pos_x: 40, pos_y: 360, waiter_id: null, opened_at: null, reservation_name: null },
  { id: "t12", number: 12, seats: 6, status: "occupied", pos_x: 200, pos_y: 360, waiter_id: "w1", opened_at: new Date(now - 12 * 60_000).toISOString(), reservation_name: null },
];

const initialMockItems: Record<string, MockItem[]> = {
  t1: [
    { id: "i1", table_id: "t1", name: "Chopp Pilsen 300ml", qty: 4, price: 12 },
    { id: "i2", table_id: "t1", name: "Porção de Pastel", qty: 1, price: 38 },
  ],
  t3: [
    { id: "i3", table_id: "t3", name: "Picanha na Chapa", qty: 1, price: 89 },
    { id: "i4", table_id: "t3", name: "Refrigerante 2L", qty: 1, price: 15 },
    { id: "i5", table_id: "t3", name: "Farofa Especial", qty: 2, price: 12 },
  ],
  t6: [
    { id: "i6", table_id: "t6", name: "Rodízio Executivo", qty: 4, price: 79.9 },
    { id: "i7", table_id: "t6", name: "Suco Natural", qty: 4, price: 12 },
  ],
  t8: [
    { id: "i8", table_id: "t8", name: "Combo Família", qty: 1, price: 189 },
    { id: "i9", table_id: "t8", name: "Cerveja Long Neck", qty: 6, price: 11 },
  ],
  t12: [
    { id: "i10", table_id: "t12", name: "Feijoada Completa", qty: 3, price: 68 },
    { id: "i11", table_id: "t12", name: "Caipirinha", qty: 3, price: 22 },
  ],
};

const GRID = 40;
const CANVAS_W = 900;
const CANVAS_H = 560;
const TABLE_SIZE = 96;

function MesasPage() {
  const [tables, setTables] = React.useState<MockTable[]>(initialMockTables);
  const [items, setItems] = React.useState<Record<string, MockItem[]>>(initialMockItems);
  const [editMode, setEditMode] = React.useState(false);
  const [openNew, setOpenNew] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<{ id: string; dx: number; dy: number } | null>(null);

  const selected = selectedId ? tables.find((t) => t.id === selectedId) ?? null : null;

  const stats = React.useMemo(() => {
    const occ = tables.filter((t) => t.status === "occupied").length;
    const free = tables.filter((t) => t.status === "free").length;
    const res = tables.filter((t) => t.status === "reserved").length;
    const revenue = tables
      .filter((t) => t.status === "occupied")
      .reduce(
        (s, t) => s + (items[t.id]?.reduce((a, i) => a + i.qty * i.price, 0) ?? 0),
        0,
      );
    const seats = tables.reduce((s, t) => s + t.seats, 0);
    const occSeats = tables
      .filter((t) => t.status === "occupied")
      .reduce((s, t) => s + t.seats, 0);
    return { total: tables.length, occ, free, res, revenue, seats, occSeats };
  }, [tables, items]);

  function onPointerDown(e: React.PointerEvent, t: MockTable) {
    if (!editMode) return;
    e.preventDefault();
    const rect = surfaceRef.current!.getBoundingClientRect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      id: t.id,
      dx: e.clientX - rect.left - t.pos_x,
      dy: e.clientY - rect.top - t.pos_y,
    });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const rect = surfaceRef.current!.getBoundingClientRect();
    const nx = Math.max(
      0,
      Math.min(CANVAS_W - TABLE_SIZE, Math.round((e.clientX - rect.left - drag.dx) / 8) * 8),
    );
    const ny = Math.max(
      0,
      Math.min(CANVAS_H - TABLE_SIZE, Math.round((e.clientY - rect.top - drag.dy) / 8) * 8),
    );
    setTables((prev) =>
      prev.map((x) => (x.id === drag.id ? { ...x, pos_x: nx, pos_y: ny } : x)),
    );
  }
  function onPointerUp() {
    setDrag(null);
  }

  function updateTable(id: string, patch: Partial<MockTable>) {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTable(number: number, seats: number) {
    const id = `t${Date.now()}`;
    setTables((prev) => [
      ...prev,
      {
        id,
        number,
        seats,
        status: "free",
        pos_x: 40,
        pos_y: 40,
        waiter_id: null,
        opened_at: null,
        reservation_name: null,
      },
    ]);
    toast.success("Mesa criada");
  }

  function removeTable(id: string) {
    setTables((prev) => prev.filter((t) => t.id !== id));
    setItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.success("Mesa removida");
    setSelectedId(null);
  }

  function openComanda(id: string, waiterId: string | null) {
    updateTable(id, {
      status: "occupied",
      waiter_id: waiterId,
      opened_at: new Date().toISOString(),
    });
    toast.success("Comanda aberta");
    setSelectedId(null);
  }

  function closeComanda(id: string) {
    updateTable(id, { status: "free", waiter_id: null, opened_at: null });
    setItems((prev) => ({ ...prev, [id]: [] }));
    toast.success("Conta fechada");
    setSelectedId(null);
  }

  function addItem(tableId: string, name: string, qty: number, price: number) {
    setItems((prev) => ({
      ...prev,
      [tableId]: [
        ...(prev[tableId] ?? []),
        { id: `i${Date.now()}`, table_id: tableId, name, qty, price },
      ],
    }));
  }

  function removeItem(tableId: string, id: string) {
    setItems((prev) => ({
      ...prev,
      [tableId]: (prev[tableId] ?? []).filter((i) => i.id !== id),
    }));
  }

  function transfer(fromId: string, toId: string) {
    const from = tables.find((t) => t.id === fromId);
    if (!from) return;
    setItems((prev) => ({
      ...prev,
      [toId]: [...(prev[fromId] ?? [])],
      [fromId]: [],
    }));
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === toId)
          return {
            ...t,
            status: "occupied",
            waiter_id: from.waiter_id,
            opened_at: from.opened_at,
          };
        if (t.id === fromId)
          return { ...t, status: "free", waiter_id: null, opened_at: null };
        return t;
      }),
    );
    toast.success("Comanda transferida");
    setSelectedId(null);
  }

  function merge(sourceId: string, targetId: string) {
    setItems((prev) => ({
      ...prev,
      [targetId]: [...(prev[targetId] ?? []), ...(prev[sourceId] ?? [])],
      [sourceId]: [],
    }));
    updateTable(sourceId, { status: "free", waiter_id: null, opened_at: null });
    toast.success("Mesas unificadas");
    setSelectedId(null);
  }

  return (
    <AdminShell title="Mesas">
      <div className="px-4 py-6 sm:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mapa do salão</h2>
            <p className="text-sm text-slate-500">
              Toque em uma mesa para operar. Ative "Editar layout" para arrastar e reposicionar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {editMode ? "Concluir layout" : "Editar layout"}
            </Button>
            <Button onClick={() => setOpenNew(true)}>
              <Plus className="h-4 w-4" /> Nova mesa
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Ocupadas" value={`${stats.occ}/${stats.total}`} tone="orange" />
          <StatCard label="Livres" value={stats.free} tone="emerald" />
          <StatCard label="Reservadas" value={stats.res} tone="slate" />
          <StatCard label="Consumo em aberto" value={brl(stats.revenue)} tone="primary" />
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
          <LegendDot cls="bg-emerald-500" label="Livre" />
          <LegendDot cls="bg-orange-500" label="Ocupada" />
          <LegendDot cls="bg-indigo-400" label="Reservada" />
          <span className="ml-auto text-slate-400">
            {editMode
              ? "Modo edição: arraste para reposicionar (snap a 8px)."
              : "Ocupação de lugares: " + stats.occSeats + "/" + stats.seats}
          </span>
        </div>

        {/* Canvas */}
        <div
          className={cn(
            "mt-4 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm",
            editMode && "ring-2 ring-primary/30",
          )}
        >
          <div
            ref={surfaceRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              position: "relative",
              backgroundImage:
                "linear-gradient(#eef2f7 1px, transparent 1px), linear-gradient(90deg, #eef2f7 1px, transparent 1px)",
              backgroundSize: `${GRID}px ${GRID}px`,
              touchAction: editMode ? "none" : "auto",
            }}
          >
            {tables.map((t) => (
              <TableChip
                key={t.id}
                t={t}
                editMode={editMode}
                onPointerDown={(e) => onPointerDown(e, t)}
                onClick={() => {
                  if (editMode || drag) return;
                  setSelectedId(t.id);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <NewTableSheet
        open={openNew}
        onOpenChange={setOpenNew}
        onCreate={addTable}
        nextNumber={Math.max(0, ...tables.map((t) => t.number)) + 1}
      />

      <TableActionSheet
        table={selected}
        allTables={tables}
        waiters={MOCK_WAITERS}
        items={selected ? items[selected.id] ?? [] : []}
        onClose={() => setSelectedId(null)}
        onOpen={openComanda}
        onCloseCheck={closeComanda}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onTransfer={transfer}
        onMerge={merge}
        onDelete={removeTable}
      />
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone: "orange" | "emerald" | "slate" | "primary";
}) {
  const map = {
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
    primary: "bg-primary/10 text-primary ring-primary/10",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 inline-flex items-baseline rounded-lg px-2 py-1 text-xl font-black ring-1",
          map[tone],
        )}
      >
        {value}
      </div>
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
  t: MockTable;
  editMode: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: () => void;
}) {
  const tone =
    t.status === "free"
      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white ring-emerald-700/30"
      : t.status === "occupied"
        ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-orange-700/30"
        : "bg-gradient-to-br from-indigo-300 to-indigo-500 text-white ring-indigo-700/30";

  const elapsed = t.opened_at
    ? Math.floor((Date.now() - new Date(t.opened_at).getTime()) / 60000)
    : 0;

  return (
    <button
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{ left: t.pos_x, top: t.pos_y, width: TABLE_SIZE, height: TABLE_SIZE, position: "absolute" }}
      className={cn(
        "grid select-none place-items-center rounded-2xl shadow-lg ring-2 transition-transform",
        editMode ? "cursor-grab active:cursor-grabbing active:scale-95" : "hover:scale-[1.04]",
        tone,
      )}
      aria-label={`Mesa ${t.number}`}
    >
      <div className="text-2xl font-black leading-none">{t.number}</div>
      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-95">
        <UsersIcon className="h-3 w-3" />
        {t.seats}
      </div>
      {t.status === "occupied" && (
        <div className="absolute bottom-1.5 flex items-center gap-0.5 rounded-full bg-black/25 px-1.5 py-0.5 text-[9px] font-bold">
          <Clock className="h-2.5 w-2.5" />
          {elapsed}m
        </div>
      )}
    </button>
  );
}

function NewTableSheet({
  open,
  onOpenChange,
  onCreate,
  nextNumber,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (n: number, s: number) => void;
  nextNumber: number;
}) {
  const [num, setNum] = React.useState(nextNumber);
  const [seats, setSeats] = React.useState(4);
  React.useEffect(() => {
    if (open) {
      setNum(nextNumber);
      setSeats(4);
    }
  }, [open, nextNumber]);

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
            <Input type="number" value={num} onChange={(e) => setNum(Number(e.target.value))} />
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
          <Button
            onClick={() => {
              onCreate(num, seats);
              onOpenChange(false);
            }}
          >
            Criar mesa
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
  items,
  onClose,
  onOpen,
  onCloseCheck,
  onAddItem,
  onRemoveItem,
  onTransfer,
  onMerge,
  onDelete,
}: {
  table: MockTable | null;
  allTables: MockTable[];
  waiters: MockWaiter[];
  items: MockItem[];
  onClose: () => void;
  onOpen: (id: string, waiterId: string | null) => void;
  onCloseCheck: (id: string) => void;
  onAddItem: (id: string, name: string, qty: number, price: number) => void;
  onRemoveItem: (tableId: string, id: string) => void;
  onTransfer: (from: string, to: string) => void;
  onMerge: (from: string, to: string) => void;
  onDelete: (id: string) => void;
}) {
  const [waiterId, setWaiterId] = React.useState("");
  const [name, setName] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [price, setPrice] = React.useState(0);
  const [transferTo, setTransferTo] = React.useState("");
  const [mergeTo, setMergeTo] = React.useState("");

  const isOpen = !!table;
  const occupied = table?.status === "occupied";
  const reserved = table?.status === "reserved";

  React.useEffect(() => {
    if (!table) return;
    setWaiterId(table.waiter_id ?? "");
    setName("");
    setQty(1);
    setPrice(0);
    setTransferTo("");
    setMergeTo("");
  }, [table]);

  if (!table) return null;

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const waiter = waiters.find((w) => w.id === table.waiter_id);
  const elapsed = table.opened_at
    ? Math.floor((Date.now() - new Date(table.opened_at).getTime()) / 60000)
    : 0;

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Mesa {table.number}
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {table.seats} lugares
            </span>
          </SheetTitle>
          <SheetDescription>
            {reserved
              ? `Reservada${table.reservation_name ? " · " + table.reservation_name : ""}`
              : occupied
                ? `Ocupada há ${elapsed} min${waiter ? " · " + waiter.name : ""}`
                : "Mesa livre — pronta para abrir uma comanda."}
          </SheetDescription>
        </SheetHeader>

        {reserved ? (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
            {table.reservation_name ?? "Reservada"}
          </div>
        ) : !occupied ? (
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
              <Button variant="ghost" onClick={() => onDelete(table.id)}>
                <Trash2 className="h-4 w-4 text-red-500" /> Remover mesa
              </Button>
              <Button onClick={() => onOpen(table.id, waiterId || null)}>Abrir comanda</Button>
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
                        onClick={() => onRemoveItem(table.id, it.id)}
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
                <Button
                  size="sm"
                  onClick={() => {
                    if (!name.trim() || qty <= 0) return;
                    onAddItem(table.id, name, qty, price);
                    setName("");
                    setQty(1);
                    setPrice(0);
                  }}
                >
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
                  onClick={() => transferTo && onTransfer(table.id, transferTo)}
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
                  onClick={() => mergeTo && onMerge(table.id, mergeTo)}
                  disabled={!mergeTo}
                >
                  <Merge className="h-4 w-4" /> Unificar
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3">
              <Button variant="outline" onClick={() => toast.info("Envie para a impressora configurada em /admin/impressao")}>
                <Printer className="h-4 w-4" /> Imprimir conta
              </Button>
              <Button onClick={() => onCloseCheck(table.id)}>Fechar conta</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
