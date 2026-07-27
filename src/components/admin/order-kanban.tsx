import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { OrderRow } from "@/lib/orders-api";
import {
  KANBAN_COLUMNS,
  NEXT_STATUS,
  STATUS_LABEL,
  updateOrderStatus,
  type AdminOrderStatus,
} from "@/lib/admin/admin-orders";
import { OrderCard } from "./order-card";
import { useIsDesktop } from "@/hooks/use-media-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Inbox } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  orders: OrderRow[];
  onOrderClick: (o: OrderRow) => void;
  onChanged: () => void;
};

function groupBy(orders: OrderRow[]) {
  const map = new Map<AdminOrderStatus, OrderRow[]>();
  for (const col of KANBAN_COLUMNS) map.set(col.id, []);
  for (const o of orders) {
    let s = o.status as AdminOrderStatus;
    if (s === "confirmed") s = "received";
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(o);
  }
  return map;
}

export function OrderKanban({ orders, onOrderClick, onChanged }: Props) {
  const isDesktop = useIsDesktop();
  const grouped = React.useMemo(() => groupBy(orders), [orders]);

  if (isDesktop) return <KanbanDesktop grouped={grouped} onClick={onOrderClick} onChanged={onChanged} />;
  return <KanbanMobile grouped={grouped} onClick={onOrderClick} onChanged={onChanged} />;
}

/* -------------------- Desktop: drag & drop -------------------- */

function KanbanDesktop({
  grouped,
  onClick,
  onChanged,
}: {
  grouped: Map<AdminOrderStatus, OrderRow[]>;
  onClick: (o: OrderRow) => void;
  onChanged: () => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [active, setActive] = React.useState<OrderRow | null>(null);

  function onDragStart(e: DragStartEvent) {
    const id = e.active.id as string;
    for (const list of grouped.values()) {
      const o = list.find((x) => x.id === id);
      if (o) return setActive(o);
    }
  }

  async function onDragEnd(e: DragEndEvent) {
    setActive(null);
    if (!e.over) return;
    const id = e.active.id as string;
    const target = e.over.id as AdminOrderStatus;
    let current: OrderRow | undefined;
    for (const list of grouped.values()) {
      current = list.find((x) => x.id === id);
      if (current) break;
    }
    if (!current || current.status === target) return;
    try {
      await updateOrderStatus(id, target);
      toast.success(`Movido para "${STATUS_LABEL[target]}"`);
      onChanged();
    } catch {
      toast.error("Falha ao mover o pedido.");
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            status={col.id}
            label={col.label}
            orders={grouped.get(col.id) ?? []}
            onClick={onClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <OrderCard order={active} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  label,
  orders,
  onClick,
}: {
  status: AdminOrderStatus;
  label: string;
  orders: OrderRow[];
  onClick: (o: OrderRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-3 transition-colors",
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-900">{label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 tabular-nums shadow-sm">
          {orders.length}
        </span>
      </div>
      <div className="flex min-h-[100px] flex-col gap-2">
        {orders.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-slate-300 py-6 text-xs text-slate-400">
            Sem pedidos
          </div>
        ) : (
          orders.map((o) => <DraggableOrder key={o.id} order={o} onClick={() => onClick(o)} />)
        )}
      </div>
    </div>
  );
}

function DraggableOrder({ order, onClick }: { order: OrderRow; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id });
  return (
    <div ref={setNodeRef} className={isDragging ? "opacity-0" : ""}>
      <OrderCard
        order={order}
        onClick={onClick}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

/* -------------------- Mobile: abas + menu -------------------- */

function KanbanMobile({
  grouped,
  onClick,
  onChanged,
}: {
  grouped: Map<AdminOrderStatus, OrderRow[]>;
  onClick: (o: OrderRow) => void;
  onChanged: () => void;
}) {
  const first = KANBAN_COLUMNS[0].id;
  return (
    <Tabs defaultValue={first}>
      <TabsList className="w-full overflow-x-auto">
        {KANBAN_COLUMNS.map((c) => {
          const n = grouped.get(c.id)?.length ?? 0;
          return (
            <TabsTrigger key={c.id} value={c.id} className="shrink-0">
              {c.label}
              <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                {n}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {KANBAN_COLUMNS.map((c) => (
        <TabsContent key={c.id} value={c.id} className="mt-4 space-y-2">
          <MobileColumn
            status={c.id}
            orders={grouped.get(c.id) ?? []}
            onClick={onClick}
            onChanged={onChanged}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function MobileColumn({
  status,
  orders,
  onClick,
  onChanged,
}: {
  status: AdminOrderStatus;
  orders: OrderRow[];
  onClick: (o: OrderRow) => void;
  onChanged: () => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-slate-300 py-10 text-slate-400">
        <Inbox className="h-6 w-6" />
        <p className="text-sm">Nenhum pedido nesta coluna</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="space-y-2">
          <OrderCard order={o} onClick={() => onClick(o)} />
          <MoveMenu status={status} orderId={o.id} onChanged={onChanged} />
        </div>
      ))}
    </div>
  );
}

function MoveMenu({
  status,
  orderId,
  onChanged,
}: {
  status: AdminOrderStatus;
  orderId: string;
  onChanged: () => void;
}) {
  const targets = KANBAN_COLUMNS.filter((c) => c.id !== status);
  async function move(to: AdminOrderStatus) {
    try {
      await updateOrderStatus(orderId, to);
      toast.success(`Movido para "${STATUS_LABEL[to]}"`);
      onChanged();
    } catch {
      toast.error("Falha ao mover o pedido.");
    }
  }
  const nextTarget = NEXT_STATUS[status];
  return (
    <div className="flex items-center gap-2">
      {nextTarget ? (
        <Button size="sm" className="h-9 flex-1" onClick={() => move(nextTarget)}>
          Avançar → {STATUS_LABEL[nextTarget]}
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-9">
            Mover <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {targets.map((t) => (
            <DropdownMenuItem key={t.id} onSelect={() => move(t.id)}>
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
