import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { CartLines, CouponBox, OrderSummary } from "@/components/cart-parts";
import { EmptyState } from "@/components/empty-state";
import { ProductSheet } from "@/components/product-sheet";
import type { Product } from "@/types";
import { useAuth } from "@/store/auth";
import { AuthGate } from "@/components/auth-gate";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Seu carrinho — Bistrô Azul" },
      { name: "description", content: "Revise seu pedido antes de finalizar." },
      { property: "og:title", content: "Seu carrinho — Bistrô Azul" },
      { property: "og:description", content: "Revise seu pedido antes de finalizar." },
    ],
  }),
  component: CarrinhoPage,
});

function CarrinhoPage() {
  const items = useCart((s) => s.items);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [authOpen, setAuthOpen] = React.useState(false);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  const goCheckout = () => {
    if (!user) return setAuthOpen(true);
    navigate({ to: "/checkout" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Seu carrinho</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4 pb-36 sm:px-6">
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Seu carrinho está vazio"
            description="Volte ao cardápio e adicione seus itens favoritos."
            action={
              <Link
                to="/"
                className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                Explorar cardápio
              </Link>
            }
            className="my-12"
          />
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <CartLines onEdit={(_it, p) => p && setEditing(p)} />
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <h3 className="mb-2 text-sm font-semibold">Cupom</h3>
              <CouponBox />
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <OrderSummary showCheckoutCta={false} />
              <button
                onClick={goCheckout}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition-colors hover:opacity-95"
              >
                Ir para o pagamento
              </button>
            </div>
          </>
        )}
      </main>

      <ProductSheet product={editing} onClose={() => setEditing(null)} />
      <AuthGate open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
