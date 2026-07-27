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
  Clock,
  RefreshCw,
  CalendarDays,
  Receipt,
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
  reservation_time: string | null;
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
  { id: "t1", number: 1, seats: 4, status: "free", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: null, reservation_time: null },
  { id: "t2", number: 2, seats: 4, status: "free", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: null, reservation_time: null },
  { id: "t3", number: 3, seats: 4, status: "occupied", pos_x: 0, pos_y: 0, waiter_id: "w2", opened_at: new Date(now - 42 * 60_000).toISOString(), reservation_name: null, reservation_time: null },
  { id: "t4", number: 4, seats: 6, status: "reserved", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: "Família Pereira", reservation_time: "18:30" },
  { id: "t5", number: 5, seats: 6, status: "free", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: null, reservation_time: null },
  { id: "t6", number: 6, seats: 4, status: "occupied", pos_x: 0, pos_y: 0, waiter_id: "w1", opened_at: new Date(now - 32 * 60_000).toISOString(), reservation_name: null, reservation_time: null },
  { id: "t7", number: 7, seats: 4, status: "free", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: null, reservation_time: null },
  { id: "t8", number: 8, seats: 6, status: "occupied", pos_x: 0, pos_y: 0, waiter_id: "w3", opened_at: new Date(now - 55 * 60_000).toISOString(), reservation_name: null, reservation_time: null },
  { id: "t9", number: 9, seats: 2, status: "free", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: null, reservation_time: null },
  { id: "t10", number: 10, seats: 4, status: "reserved", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: "João Almeida", reservation_time: "20:00" },
  { id: "t11", number: 11, seats: 4, status: "free", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: null, reservation_time: null },
  { id: "t12", number: 12, seats: 6, status: "occupied", pos_x: 0, pos_y: 0, waiter_id: "w4", opened_at: new Date(now - 18 * 60_000).toISOString(), reservation_name: null, reservation_time: null },
  { id: "t13", number: 13, seats: 4, status: "free", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: null, reservation_time: null },
];

const initialMockItems: Record<string, MockItem[]> = {
  t3: [
    { id: "i1", table_id: "t3", name: "Picanha na Chapa", qty: 1, price: 89 },
    { id: "i2", table_id: "t3", name: "Refrigerante 2L", qty: 1, price: 15 },
    { id: "i3", table_id: "t3", name: "Farofa Especial", qty: 2, price: 12 },
    { id: "i4", table_id: "t3", name: "Caipirinha", qty: 5, price: 22 },
  ],
  t6: [
    { id: "i5", table_id: "t6", name: "Rodízio Executivo", qty: 2, price: 79.9 },
    { id: "i6", table_id: "t6", name: "Suco Natural", qty: 2, price: 12 },
    { id: "i7", table_id: "t6", name: "Chopp Pilsen", qty: 1, price: 12 },
  ],
  t8: [
    { id: "i8", table_id: "t8", name: "Combo Família", qty: 1, price: 189 },
    { id: "i9", table_id: "t8", name: "Cerveja Long Neck", qty: 12, price: 11 },
  ],
  t12: [
    { id: "i10", table_id: "t12", name: "Feijoada Completa", qty: 4, price: 68 },
    { id: "i11", table_id: "t12", name: "Caipirinha", qty: 4, price: 22 },
    { id: "i12", table_id: "t12", name: "Sobremesa", qty: 1, price: 17.1 },
  ],
};

function MesasPage() {
  const [tables, setTables] = React.useState<MockTable[]>(initialMockTables);
  const [items, setItems] = React.useState<Record<string, MockItem[]>>(initialMockItems);
  const [openNew, setOpenNew] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = selectedId ? tables.find((t) => t.id === selectedId) ?? null : null;

  const stats = React.useMemo(() => {
    const occ = tables.filter((t) => t.status === "occupied").length;
    const free = tables.filter((t) => t.status === "free").length;
    const res = tables.filter((t) => t.status === "reserved").length;
    const revenue = tables
      .filter((t) => t.status === "occupied")
      .reduce((s, t) => s + (items[t.id]?.reduce((a, i) => a + i.qty * i.price, 0) ?? 0), 0);
    return { total: tables.length, occ, free, res, revenue };
  }, [tables, items]);

  function updateTable(id: string, patch: Partial<MockTable>) {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTable(number: number, seats: number) {
    const id = `t${Date.now()}`;
    setTables((prev) => [
      ...prev,
      { id, number, seats, status: "free", pos_x: 0, pos_y: 0, waiter_id: null, opened_at: null, reservation_name: null, reservation_time: null },
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
    updateTable(id, { status: "occupied", waiter_id: waiterId, opened_at: new Date().toISOString() });
    toast.success("Comanda aberta");
    setSelectedId(null);
  }

  function closeComanda(id: string) {
    updateTable(id, { status: "free", waiter_id: null, opened_at: null });
    setItems((prev) => ({ ...prev, [id]: [] }));
    toast.success("Conta fechada");
    setSelectedId(null);
  }

  function reserveTable(id: string, name: string, time: string) {
    updateTable(id, {
      status: "reserved",
      reservation_name: name || null,
      reservation_time: time || null,
      waiter_id: null,
      opened_at: null,
    });
    toast.success("Mesa reservada");
    setSelectedId(null);
  }

  function cancelReservation(id: string) {
    updateTable(id, {
      status: "free",
      reservation_name: null,
      reservation_time: null,
    });
    toast.info("Reserva cancelada");
    setSelectedId(null);
  }

  function arriveReservation(id: string, waiterId: string | null) {
    updateTable(id, {
      status: "occupied",
      waiter_id: waiterId,
      opened_at: new Date().toISOString(),
      reservation_name: null,
      reservation_time: null,
    });
    toast.success("Cliente chegou · comanda aberta");
    setSelectedId(null);
  }

  function addItem(tableId: string, name: string, qty: number, price: number) {
    setItems((prev) => ({
      ...prev,
      [tableId]: [...(prev[tableId] ?? []), { id: `i${Date.now()}`, table_id: tableId, name, qty, price }],
    }));
  }

  function removeItem(tableId: string, id: string) {
    setItems((prev) => ({ ...prev, [tableId]: (prev[tableId] ?? []).filter((i) => i.id !== id) }));
  }

  function transfer(fromId: string, toId: string) {
    const from = tables.find((t) => t.id === fromId);
    if (!from) return;
    setItems((prev) => ({ ...prev, [toId]: [...(prev[fromId] ?? [])], [fromId]: [] }));
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === toId) return { ...t, status: "occupied", waiter_id: from.waiter_id, opened_at: from.opened_at };
        if (t.id === fromId) return { ...t, status: "free", waiter_id: null, opened_at: null };
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

  const pct = (n: number) => (stats.total ? (n / stats.total) * 100 : 0);

  return (
    <AdminShell title="Mesas">
      <div className="space-y-5 px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-slate-900">Mapa do salão</h2>
            <p className="text-sm text-slate-500">
              Toque em uma mesa para operar. Arraste para reposicionar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => toast.info("Reorganização visual em breve.")}>
              <Pencil className="h-4 w-4" /> Editar layout
            </Button>
            <Button onClick={() => setOpenNew(true)}>
              <Plus className="h-4 w-4" /> Nova mesa
            </Button>

          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Ocupadas"
            value={`${stats.occ} / ${stats.total}`}
            pct={pct(stats.occ)}
            tone="orange"
            icon={<UsersIcon className="h-4 w-4" />}
          />
          <MetricCard
            label="Livres"
            value={stats.free}
            pct={pct(stats.free)}
            tone="emerald"
            icon={<ChairGlyph className="h-4 w-4" />}
          />
          <MetricCard
            label="Reservadas"
            value={stats.res}
            pct={pct(stats.res)}
            tone="blue"
            icon={<CalendarDays className="h-4 w-4" />}
          />
          <MetricCard
            label="Consumo em aberto"
            value={brl(stats.revenue)}
            pct={100}
            tone="slate"
            icon={<Receipt className="h-4 w-4" />}
          />
        </div>

        {/* Grade de mesas */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-4 py-3 text-xs">
            <LegendDot cls="bg-emerald-500" label="Livre" />
            <LegendDot cls="bg-orange-500" label="Ocupada" />
            <LegendDot cls="bg-blue-500" label="Reservada" />
            <span className="ml-auto flex items-center gap-2 text-slate-400">
              Última atualização: agora há pouco
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Atualizar"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
            {tables.map((t) => {
              const total = items[t.id]?.reduce((s, i) => s + i.qty * i.price, 0) ?? 0;
              return <TableCard key={t.id} t={t} total={total} onClick={() => setSelectedId(t.id)} />;
            })}
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
        onReserve={reserveTable}
        onCancelReservation={cancelReservation}
        onArrive={arriveReservation}
      />
    </AdminShell>
  );
}

/* ============= UI ============= */

const TONE = {
  orange: { text: "text-orange-600", bar: "bg-orange-500", chip: "bg-orange-50 text-orange-600" },
  emerald: { text: "text-emerald-600", bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-600" },
  blue: { text: "text-blue-600", bar: "bg-blue-500", chip: "bg-blue-50 text-blue-600" },
  slate: { text: "text-slate-900", bar: "bg-slate-900", chip: "bg-slate-100 text-slate-700" },
} as const;

function MetricCard({
  label,
  value,
  pct,
  tone,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  pct: number;
  tone: keyof typeof TONE;
  icon: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {label}
          </div>
          <div className={cn("mt-1 text-lg font-black tabular-nums leading-tight", t.text)}>
            {value}
          </div>
        </div>
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", t.chip)}>
          {icon}
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", t.bar)}
          style={{ width: `${Math.max(6, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-600">
      <span className={cn("h-2 w-2 rounded-full", cls)} />
      {label}
    </span>
  );
}

function TableCard({
  t,
  total,
  onClick,
}: {
  t: MockTable;
  total: number;
  onClick: () => void;
}) {
  const config =
    t.status === "occupied"
      ? {
          border: "border-orange-200",
          bg: "bg-orange-50/60 hover:bg-orange-50",
          stroke: "#f97316",
          dot: "bg-orange-500",
          label: "Ocupada",
          labelCls: "text-orange-600",
        }
      : t.status === "reserved"
        ? {
            border: "border-blue-200",
            bg: "bg-blue-50/60 hover:bg-blue-50",
            stroke: "#3b82f6",
            dot: "bg-blue-500",
            label: "Reservada",
            labelCls: "text-blue-600",
          }
        : {
            border: "border-emerald-200",
            bg: "bg-white hover:bg-emerald-50/40",
            stroke: "#10b981",
            dot: "bg-emerald-500",
            label: "Livre",
            labelCls: "text-emerald-600",
          };

  const shape: "round" | "square" = t.seats % 2 === 0 && t.seats >= 6 ? "square" : t.number % 2 === 1 ? "round" : "square";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-xl border p-3 text-center shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        config.border,
        config.bg,
      )}
      aria-label={`Mesa ${t.number}`}
    >
      <TableGlyph shape={shape} seats={t.seats} stroke={config.stroke} />
      <div className="text-xl font-black leading-none tracking-tight text-slate-900">
        {String(t.number).padStart(2, "0")}
      </div>
      <div className="flex items-center gap-1.5 text-[12px] font-medium">
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
        <span className={config.labelCls}>{config.label}</span>
      </div>
      <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums">
        {t.status === "occupied" ? (
          <span className="text-orange-600">{brl(total)}</span>
        ) : t.status === "reserved" ? (
          <span className="inline-flex items-center gap-1 text-blue-600">
            <Clock className="h-3 w-3" />
            {t.reservation_time ?? "—"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <UsersIcon className="h-3 w-3" />
            {t.seats} lugares
          </span>
        )}
      </div>
    </button>
  );
}

function TableGlyph({
  shape,
  seats,
  stroke,
}: {
  shape: "round" | "square";
  seats: number;
  stroke: string;
}) {
  // chair positions: top, bottom, left, right (+ extra for 6/8 seats)
  const chairs =
    seats >= 6
      ? [
          { x: 18, y: 4, w: 12, h: 6 },
          { x: 34, y: 4, w: 12, h: 6 },
          { x: 18, y: 54, w: 12, h: 6 },
          { x: 34, y: 54, w: 12, h: 6 },
          { x: 4, y: 26, w: 6, h: 12 },
          { x: 54, y: 26, w: 6, h: 12 },
        ]
      : [
          { x: 26, y: 4, w: 12, h: 6 },
          { x: 26, y: 54, w: 12, h: 6 },
          { x: 4, y: 26, w: 6, h: 12 },
          { x: 54, y: 26, w: 6, h: 12 },
        ];
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" stroke={stroke} strokeWidth="1.8">
      {shape === "round" ? (
        <circle cx="32" cy="32" r="14" />
      ) : (
        <rect x="18" y="18" width="28" height="28" rx="3" />
      )}
      {chairs.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx="2" />
      ))}
    </svg>
  );
}

function ChairGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" />
      <path d="M5 10h14l-1 6H6z" />
      <path d="M8 16v4M16 16v4" />
    </svg>
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
  onReserve,
  onCancelReservation,
  onArrive,
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
  onReserve: (id: string, name: string, time: string) => void;
  onCancelReservation: (id: string) => void;
  onArrive: (id: string, waiterId: string | null) => void;
}) {
  const [waiterId, setWaiterId] = React.useState("");
  const [name, setName] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [price, setPrice] = React.useState(0);
  const [transferTo, setTransferTo] = React.useState("");
  const [mergeTo, setMergeTo] = React.useState("");
  const [mode, setMode] = React.useState<"open" | "reserve">("open");
  const [reserveName, setReserveName] = React.useState("");
  const [reserveTime, setReserveTime] = React.useState("");

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
    setMode("open");
    setReserveName("");
    setReserveTime("");
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
                : "Mesa livre — abra uma comanda ou registre uma reserva."}
          </SheetDescription>
        </SheetHeader>

        {reserved ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                Reserva confirmada
              </div>
              <div className="mt-1 text-base font-semibold">
                {table.reservation_name ?? "Sem nome"}
              </div>
              {table.reservation_time && (
                <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-700">
                  <Clock className="h-3.5 w-3.5" /> Chegada prevista: {table.reservation_time}
                </div>
              )}
            </div>
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
            <div className="flex flex-wrap justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => onCancelReservation(table.id)}>
                <X className="h-4 w-4 text-red-500" /> Cancelar reserva
              </Button>
              <Button onClick={() => onArrive(table.id, waiterId || null)}>
                Cliente chegou · abrir comanda
              </Button>
            </div>
          </div>
        ) : !occupied ? (
          <div className="mt-4 space-y-3">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("open")}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition",
                  mode === "open"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                Abrir comanda
              </button>
              <button
                type="button"
                onClick={() => setMode("reserve")}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition",
                  mode === "reserve"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                Reservar
              </button>
            </div>

            {mode === "open" ? (
              <>
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
                  <Button onClick={() => onOpen(table.id, waiterId || null)}>
                    Abrir comanda
                  </Button>
                </div>
              </>
            ) : (
              <>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                  <span>Nome do cliente</span>
                  <Input
                    value={reserveName}
                    onChange={(e) => setReserveName(e.target.value)}
                    placeholder="Ex.: Família Silva"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                  <span>Horário previsto</span>
                  <Input
                    type="time"
                    value={reserveTime}
                    onChange={(e) => setReserveTime(e.target.value)}
                  />
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setMode("open")}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      if (!reserveName.trim()) {
                        toast.error("Informe o nome do cliente");
                        return;
                      }
                      onReserve(table.id, reserveName.trim(), reserveTime);
                    }}
                  >
                    <CalendarDays className="h-4 w-4" /> Confirmar reserva
                  </Button>
                </div>
              </>
            )}
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
