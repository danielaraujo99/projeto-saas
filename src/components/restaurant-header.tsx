import { Star, Clock, Bike, MapPin } from "lucide-react";
import { restaurant } from "@/data/restaurant";
import { brl } from "@/lib/format";

export function RestaurantHeader() {
  const r = restaurant;
  return (
    <header className="relative">
      <div className="relative h-44 w-full overflow-hidden bg-muted sm:h-60 lg:h-72">
        <img src={r.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>
      <div className="mx-auto -mt-16 max-w-6xl px-4 sm:-mt-20 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-card)] sm:h-24 sm:w-24">
              <img src={r.logo} alt={r.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                    (r.isOpen
                      ? "bg-success/15 text-[color:oklch(0.35_0.1_155)]"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  <span
                    className={
                      "h-1.5 w-1.5 rounded-full " +
                      (r.isOpen ? "bg-success" : "bg-muted-foreground")
                    }
                  />
                  {r.isOpen ? "Aberto agora" : "Fechado"}
                </span>
              </div>
              <h1 className="mt-1.5 truncate text-xl font-bold text-foreground sm:text-2xl">
                {r.name}
              </h1>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{r.categoriesLabel}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <InfoPill>
              <Star className="h-3.5 w-3.5 fill-warning text-warning" strokeWidth={2} />
              <span className="font-semibold text-foreground tabular-nums">
                {r.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">({r.reviewsCount})</span>
            </InfoPill>
            <InfoPill>
              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="tabular-nums">
                {r.deliveryMinutes[0]}–{r.deliveryMinutes[1]} min
              </span>
            </InfoPill>
            <InfoPill>
              <Bike className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="tabular-nums">{brl(r.deliveryFee)}</span>
            </InfoPill>
            <InfoPill>
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="tabular-nums">{r.distanceKm.toFixed(1)} km</span>
            </InfoPill>
          </div>
        </div>
      </div>
    </header>
  );
}

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
