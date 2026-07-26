import { useNavigate } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { brl } from "@/lib/format";

export function FloatingCartBar() {
  const count = useCart((s) => s.itemCount());
  const subtotal = useCart((s) => s.subtotal());
  const navigate = useNavigate();

  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:hidden">
      <button
        onClick={() => navigate({ to: "/carrinho" })}
        className="pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-foreground/15 text-sm font-bold">
            {count}
          </span>
          <span className="text-sm font-semibold">
            <ShoppingBag className="mr-1 inline h-4 w-4" />
            Ver carrinho
          </span>
        </span>
        <span className="text-sm font-bold tabular-nums">{brl(subtotal)}</span>
      </button>
    </div>
  );
}
