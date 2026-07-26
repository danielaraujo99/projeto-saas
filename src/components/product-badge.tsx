import { Flame, Percent, Ban } from "lucide-react";
import type { ProductBadge } from "@/types";
import { cn } from "@/lib/utils";

const map: Record<
  ProductBadge,
  { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }
> = {
  popular: {
    label: "Mais pedido",
    icon: Flame,
    cls: "bg-warning/15 text-[color:oklch(0.5_0.15_60)]",
  },
  promo: { label: "Promoção", icon: Percent, cls: "bg-primary-soft text-primary" },
  out: { label: "Em falta", icon: Ban, cls: "bg-muted text-muted-foreground" },
};

export function ProductBadgePill({ kind }: { kind: ProductBadge }) {
  const m = map[kind];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        m.cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}
