import { cn } from "@/lib/utils";
import { STATUS_LABEL, type AdminOrderStatus } from "@/lib/admin/admin-orders";

const TONE: Record<AdminOrderStatus, string> = {
  pending_payment: "bg-muted text-muted-foreground",
  received: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  preparing: "bg-amber-100 text-amber-800",
  delivering: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  canceled: "bg-rose-100 text-rose-700",
  concluded: "bg-slate-200 text-slate-700",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AdminOrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TONE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
