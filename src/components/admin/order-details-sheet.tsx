import * as React from "react";
import { AdaptiveSheet } from "@/components/adaptive-sheet";
import { Button } from "@/components/ui/button";
import type { OrderRow } from "@/lib/orders-api";
import { brl } from "@/lib/format";
import {
  KANBAN_COLUMNS,
  NEXT_STATUS,
  STATUS_LABEL,
  updateOrderStatus,
  type AdminOrderStatus,
} from "@/lib/admin/admin-orders";
import { StatusBadge } from "./status-badge";
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
import { toast } from "sonner";
import {
  Bike,
  Check,
  ChevronRight,
  MapPin,
  ShoppingBag,
  Wallet,
  X,
} from "lucide-react";

export function OrderDetailsSheet({
  order,
  onClose,
  onChanged,
}: {
  order: OrderRow | null;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const status = (order?.status ?? "received") as AdminOrderStatus;
  const next = NEXT_STATUS[status];

  async function advance() {
    if (!order || !next) return;
    setBusy(true);
    try {
      await updateOrderStatus(order.id, next);
      toast.success(`Pedido movido para "${STATUS_LABEL[next]}"`);
      onChanged?.();
      onClose();
    } catch (e) {
      toast.error("Não foi possível atualizar o pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!order) return;
    setBusy(true);
    try {
      await updateOrderStatus(order.id, "canceled");
      toast.success("Pedido cancelado");
      onChanged?.();
      setCancelOpen(false);
      onClose();
    } catch {
      toast.error("Não foi possível cancelar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdaptiveSheet
        open={!!order}
        onOpenChange={(o) => !o && onClose()}
        title="Detalhes do pedido"
        size="lg"
      >
        {order ? (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pedido #{order.short_id}
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {brl(Number(order.total))}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                  <StatusBadge status={status} />
                  <span>·</span>
                  <span>
                    {new Date(order.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
              <Section title="Itens">
                <ul className="divide-y divide-slate-100">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
                            {it.quantity}×
                          </span>
                          <span className="font-semibold text-slate-900">{it.name}</span>
                        </div>
                        {it.customizations.length ? (
                          <ul className="mt-1 space-y-0.5 pl-6 text-[12px] text-slate-500">
                            {it.customizations.map((c, j) => (
                              <li key={j}>+ {c.optionName}</li>
                            ))}
                          </ul>
                        ) : null}
                        {it.note ? (
                          <div className="mt-1 pl-6 text-[12px] italic text-slate-500">
                            Obs: {it.note}
                          </div>
                        ) : null}
                      </div>
                      <div className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900">
                        {brl(it.unitPrice * it.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title={order.pickup ? "Retirada no restaurante" : "Endereço de entrega"}>
                <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                  {order.pickup ? (
                    <ShoppingBag className="mt-0.5 h-4 w-4 text-primary" />
                  ) : (
                    <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  )}
                  <div className="min-w-0 text-slate-700">
                    {order.pickup ? (
                      <span>Cliente retira no balcão.</span>
                    ) : order.address ? (
                      <>
                        <div className="font-medium text-slate-900">
                          {order.address.street}, {order.address.number}
                          {order.address.complement ? ` — ${order.address.complement}` : ""}
                        </div>
                        <div className="text-[12px] text-slate-500">
                          {order.address.neighborhood} · {order.address.city}/{order.address.state}
                        </div>
                        {order.address.reference ? (
                          <div className="mt-1 text-[12px] italic text-slate-500">
                            Ref: {order.address.reference}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span>Endereço não informado</span>
                    )}
                  </div>
                </div>
              </Section>

              <Section title="Pagamento">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span>{paymentDescriptor(order.payment)}</span>
                </div>
              </Section>

              <Section title="Resumo">
                <dl className="space-y-1 text-sm">
                  <SummaryRow label="Subtotal" value={brl(Number(order.subtotal))} />
                  <SummaryRow
                    label="Entrega"
                    value={order.pickup ? "Retirada" : brl(Number(order.delivery_fee))}
                  />
                  {Number(order.discount) > 0 ? (
                    <SummaryRow
                      label={`Desconto${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
                      value={`− ${brl(Number(order.discount))}`}
                      accent
                    />
                  ) : null}
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span className="tabular-nums">{brl(Number(order.total))}</span>
                  </div>
                </dl>
              </Section>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => setCancelOpen(true)}
                disabled={busy || status === "canceled" || status === "delivered"}
              >
                <X className="h-4 w-4" /> Cancelar pedido
              </Button>
              {next ? (
                <Button onClick={advance} disabled={busy} className="min-w-[220px]">
                  <ChevronRight className="h-4 w-4" />
                  Avançar para "{STATUS_LABEL[next]}"
                </Button>
              ) : status === "delivered" ? (
                <Button disabled variant="secondary">
                  <Check className="h-4 w-4" /> Pedido concluído
                </Button>
              ) : (
                <Button disabled variant="secondary">
                  Pedido finalizado
                </Button>
              )}
            </div>
          </>
        ) : null}
      </AdaptiveSheet>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              O cliente verá o cancelamento no aplicativo. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancel}
              disabled={busy}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Cancelar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={accent ? "font-semibold text-emerald-600" : "font-medium text-slate-800"}>
        {value}
      </dd>
    </div>
  );
}

function paymentDescriptor(p: OrderRow["payment"]) {
  if (!p) return "—";
  if (p.kind === "pix") return "Pix";
  if (p.kind === "cash")
    return "change" in p && p.change ? `Dinheiro (troco para ${brl(p.change)})` : "Dinheiro";
  if (p.kind === "credit")
    return `Crédito · ${("brand" in p && p.brand) || ""} •••• ${("last4" in p && p.last4) || ""}`;
  if (p.kind === "debit")
    return `Débito · ${("brand" in p && p.brand) || ""} •••• ${("last4" in p && p.last4) || ""}`;
  return "—";
}
