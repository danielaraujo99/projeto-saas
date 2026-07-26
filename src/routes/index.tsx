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
      { rootMargin: "-140px 0px -60% 0px", threshold: [0, 0.25, 0.5] },
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
      <div className="sticky top-0 z-30 hidden border-b border-border bg-background/95 backdrop-blur lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="text-lg font-bold text-primary">
            Bistrô Azul
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => (user ? null : setAuthOpen(true))}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
            >
              <User2 className="h-4 w-4" />
              {user ? user.name : "Entrar"}
            </button>
            <Link
              to="/carrinho"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              <ShoppingBag className="h-4 w-4" />
              Carrinho
              {itemCount > 0 ? (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      <RestaurantHeader />

      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <main className="min-w-0">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no cardápio"
              className="h-11 rounded-full pl-9"
            />
          </div>

          <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 backdrop-blur sm:-mx-6 lg:top-[57px]">
            <CategoryTabs activeId={activeCat} onSelect={jumpTo} />
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
                className="scroll-mt-32 pt-6"
              >
                <h2 className="mb-3 text-lg font-bold text-foreground">{c.name}</h2>
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
        <aside className="hidden lg:block">
          <div className="sticky top-[80px] rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-base font-bold">Seu carrinho</h3>
            {itemCount === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="h-5 w-5" />}
                title="Vazio por enquanto"
                description="Adicione itens do cardápio para começar seu pedido."
              />
            ) : (
              <>
                <MiniCart onEdit={setSelected} />
                <div className="mt-3 border-t border-border pt-3">
                  <CouponBox />
                </div>
                <div className="mt-3">
                  <OrderSummary />
                </div>
              </>
            )}
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Pedido mínimo {brl(20)}
            </p>
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
    <div className="max-h-[40vh] overflow-auto">
      <CartLines
        onEdit={(_it, product) => {
          if (product) onEdit(product);
          else navigate({ to: "/carrinho" });
        }}
      />
    </div>
  );
}
