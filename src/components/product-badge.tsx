import { Flame, Percent, Ban, AlertCircle, CircleDashed } from "lucide-react";
import type { ProductBadge } from "@/types";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "popular"
  | "promo"
  | "out"
  | "required"
  | "optional"
  | "info";

const map: Record<
  BadgeTone,
  { label: string; icon?: React.ComponentType<{ className?: string }>; cls: string }
> = {
  popular: {
    label: "Mais pedido",
    icon: Flame,
    cls: "bg-[color:oklch(0.96_0.05_60)] text-[color:oklch(0.45_0.15_55)]",
  },
  promo: {
    label: "Promoção",
    icon: Percent,
    cls: "bg-primary-soft text-primary",
  },
  out: {
    label: "Em falta",
    icon: Ban,
    cls: "bg-muted text-muted-foreground",
  },
  required: {
    label: "Obrigatório",
    icon: AlertCircle,
    cls: "bg-primary-soft text-primary",
  },
  optional: {
    label: "Opcional",
    icon: CircleDashed,
    cls: "bg-muted text-muted-foreground",
  },
  info: {
    label: "",
    cls: "bg-muted text-muted-foreground",
  },
};

export function ProductBadgePill({
  kind,
  label,
}: {
  kind: BadgeTone | ProductBadge;
  label?: string;
}) {
  const m = map[kind as BadgeTone];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4",
        m.cls,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {label ?? m.label}
    </span>
  );
}
