import { ImageIcon } from "lucide-react";
import type { Product } from "@/types";
import { brl } from "@/lib/format";
import { ProductBadgePill } from "@/components/product-badge";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  onClick: () => void;
};

export function ProductCard({ product, onClick }: Props) {
  const disabled = product.available === false;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-stretch gap-4 rounded-2xl border border-border bg-card p-3 text-left transition-shadow",
        "hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {product.badges?.map((b) => <ProductBadgePill key={b} kind={b} />)}
          {disabled ? <ProductBadgePill kind="out" /> : null}
        </div>
        <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-foreground sm:text-base">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
          {product.description}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-bold text-foreground tabular-nums sm:text-base">
            {brl(product.price)}
          </span>
          {product.originalPrice ? (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              {brl(product.originalPrice)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>
    </button>
  );
}
