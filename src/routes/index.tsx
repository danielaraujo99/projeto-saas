import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User2 } from "lucide-react";
import { categories, products } from "@/data/menu";
import { RestaurantHeader } from "@/components/restaurant-header";
import { CategoryTabs } from "@/components/category-tabs";
import { ProductCard } from "@/components/product-card";
import { ProductSheet } from "@/components/product-sheet";
import { FloatingCartBar } from "@/components/floating-cart-bar";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types";
import { useCart } from "@/store/cart";
import { CartLines, CouponBox, OrderSummary } from "@/components/cart-parts";
import { useAuth } from "@/store/auth";
import { AuthGate } from "@/components/auth-gate";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bistrô Azul — Cardápio digital" },
      {
        name: "description",
        content:
          "Hambúrgueres artesanais, acompanhamentos e bebidas. Peça pelo cardápio digital e receba em casa.",
      },
      { property: "og:title", content: "Bistrô Azul — Cardápio digital" },
      {
        property: "og:description",
        content: "Hambúrgueres artesanais, acompanhamentos e bebidas para levar até você.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [query, setQuery] = React.useState("");
  const [activeCat, setActiveCat] = React.useState(categories[0].id);
  const [selected, setSelected] = React.useState<Product | null>(null);
  const [authOpen, setAuthOpen] = React.useState(false);
  const user = useAuth((s) => s.user);
  const itemCount = useCart((s) => s.itemCount());

  const sectionRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const scrollingByClick = React.useRef(false);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }, [query]);

  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (scrollingByClick.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveCat((visible.target as HTMLElement).dataset.section!);
      },
      { rootMargin: "-160px 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [query]);

  const jumpTo = (id: string) => {
    setActiveCat(id);
    scrollingByClick.current = true;
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => (scrollingByClick.current = false), 800);
  };

  const grouped = categories
    .map((c) => ({ ...c, items: filtered.filter((p) => p.categoryId === c.id) }))
    .filter((c) => c.items.length > 0);

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-0">
      {/* Top nav (desktop) */}
      <div className="sticky top-0 z-30 hidden bg-background/90 shadow-[0_1px_0_var(--color-border)] backdrop-blur lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary">
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold"
            >
              BA
            </span>
            Bistrô Azul
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => (user ? null : setAuthOpen(true))}
              className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-foreground hover:bg-surface"
            >
              <User2 className="h-4 w-4" />
              {user ? user.name : "Entrar"}
            </button>
            <Link
              to="/carrinho"
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
                itemCount > 0
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border text-foreground hover:bg-surface",
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              Carrinho
              {itemCount > 0 ? (
                <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs tabular-nums">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      <RestaurantHeader />

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
        <main className="min-w-0">
          <div
            className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 pb-2 pt-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-[64px] lg:pt-3"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no cardápio"
                className="h-11 rounded-full border-border bg-surface pl-10 focus-visible:bg-background"
              />
            </div>
            <div className="-mx-4 mt-2 sm:-mx-6">
              <CategoryTabs activeId={activeCat} onSelect={jumpTo} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 -bottom-3 h-3 bg-gradient-to-b from-background/60 to-transparent" />
          </div>

          {grouped.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="Nada por aqui"
              description="Não encontramos itens para essa busca. Tente outro termo."
              className="my-10"
            />
          ) : (
            grouped.map((c) => (
              <section
                key={c.id}
                ref={(el) => {
                  sectionRefs.current[c.id] = el;
                }}
                data-section={c.id}
                className="scroll-mt-40 pt-8 first:pt-6"
              >
                <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground">
                  {c.name}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {c.items.map((p) => (
                    <ProductCard key={p.id} product={p} onClick={() => setSelected(p)} />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>

        {/* Desktop cart sidebar */}
        <aside className="hidden self-start lg:sticky lg:top-[88px] lg:block">
          <div className="flex max-h-[calc(100vh-104px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-base font-bold">Seu carrinho</h3>
              {itemCount > 0 ? (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </span>
              ) : null}
            </div>
            {itemCount === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<ShoppingBag className="h-5 w-5" />}
                  title="Vazio por enquanto"
                  description="Adicione itens do cardápio para começar seu pedido."
                />
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto px-4">
                  <MiniCart onEdit={setSelected} />
                </div>
                <div className="space-y-3 border-t border-border p-4">
                  <CouponBox />
                  <OrderSummary />
                </div>
              </>
            )}
            <div className="border-t border-border bg-surface px-4 py-2.5 text-center text-[11px] text-muted-foreground">
              Pedido mínimo {brl(20)}
            </div>
          </div>
        </aside>
      </div>

      <FloatingCartBar />

      <ProductSheet product={selected} onClose={() => setSelected(null)} />
      <AuthGate open={authOpen} onOpenChange={setAuthOpen} onSuccess={() => {}} />
    </div>
  );
}

function MiniCart({ onEdit }: { onEdit: (p: Product) => void }) {
  const navigate = useNavigate();
  return (
    <CartLines
      onEdit={(_it, product) => {
        if (product) onEdit(product);
        else navigate({ to: "/carrinho" });
      }}
    />
  );
}
