import { Star, Clock, Bike, MapPin } from "lucide-react";
import { restaurant } from "@/data/restaurant";
import { brl } from "@/lib/format";

export function RestaurantHeader() {
  const r = restaurant;
  return (
    <header className="relative">
      <div className="relative h-40 w-full overflow-hidden bg-muted sm:h-56 lg:h-64">
        <img src={r.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/85" />
      </div>
      <div className="mx-auto -mt-14 max-w-6xl px-4 sm:-mt-16 sm:px-6">
        <div className="flex items-end gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-[var(--shadow-elevated)] sm:h-28 sm:w-28">
            <img src={r.logo} alt={r.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 pb-2">
            <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-[color:oklch(0.35_0.1_155)]">
              {r.isOpen ? "Aberto agora" : "Fechado"}
            </span>
            <h1 className="mt-1 truncate text-xl font-bold text-foreground sm:text-2xl">{r.name}</h1>
            <p className="truncate text-sm text-muted-foreground">{r.categoriesLabel}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Star className="h-4 w-4 fill-warning text-warning" />
            {r.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">({r.reviewsCount})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {r.deliveryMinutes[0]}–{r.deliveryMinutes[1]} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Bike className="h-4 w-4" />
            {brl(r.deliveryFee)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {r.distanceKm.toFixed(1)} km
          </span>
        </div>
      </div>
    </header>
  );
}
