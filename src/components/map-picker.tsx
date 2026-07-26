import * as React from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Search, LocateFixed, Loader2, MapPin, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";


export type ReverseAddress = {
  lat: number;
  lng: number;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postcode?: string;
  displayName: string;
};

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

const nomBase = "https://nominatim.openstreetmap.org";

async function search(q: string, signal?: AbortSignal): Promise<Suggestion[]> {
  if (q.trim().length < 3) return [];
  const url = `${nomBase}/search?format=json&addressdetails=1&countrycodes=br&limit=5&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "pt-BR" }, signal });
  if (!res.ok) return [];
  return res.json();
}

async function reverse(lat: number, lng: number): Promise<ReverseAddress | null> {
  const url = `${nomBase}/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
  if (!res.ok) return null;
  const data = await res.json();
  const a = data.address ?? {};
  return {
    lat,
    lng,
    street: a.road || a.pedestrian || a.footway || a.residential,
    neighborhood: a.suburb || a.neighbourhood || a.city_district,
    city: a.city || a.town || a.village || a.municipality,
    state: a.state,
    postcode: a.postcode,
    displayName: data.display_name,
  };
}

function MapController({
  center,
  onCenterChange,
}: {
  center: [number, number];
  onCenterChange: (c: [number, number]) => void;
}) {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [center[0], center[1]]);
  useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onCenterChange([c.lat, c.lng]);
    },
  });
  return null;
}

type Props = {
  initial?: [number, number];
  onConfirm: (addr: ReverseAddress) => void;
};

export function MapPicker({ initial, onConfirm }: Props) {
  const [center, setCenter] = React.useState<[number, number]>(
    initial ?? [-23.5613, -46.6565],
  );
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [reverseData, setReverseData] = React.useState<ReverseAddress | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [permissionDenied, setPermissionDenied] = React.useState(false);

  React.useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await search(query, ctrl.signal);
        setSuggestions(res);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await reverse(center[0], center[1]);
      if (!cancelled) {
        setReverseData(r);
        setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setLoading(false);
    };
  }, [center[0], center[1]]);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização indisponível", {
        description: "Seu navegador não suporta localização. Busque pelo endereço acima.",
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setPermissionDenied(false);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          toast.error("Permissão de localização negada", {
            description:
              "Habilite a localização nas configurações do navegador ou digite o endereço no campo acima.",
          });
        } else {
          toast.error("Não foi possível obter sua localização", {
            description: "Tente novamente ou busque pelo endereço.",
          });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };


  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative z-[500] border-b border-border bg-background p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Buscar endereço, rua ou bairro"
            className="h-11 rounded-full border-border bg-surface pl-9 pr-4 focus-visible:bg-background"
          />
        </div>
        {showSuggestions && suggestions.length > 0 ? (
          <ul className="absolute inset-x-3 top-[calc(100%-4px)] z-[600] mt-1 max-h-72 overflow-auto rounded-2xl border border-border bg-background shadow-[var(--shadow-elevated)]">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    setCenter([parseFloat(s.lat), parseFloat(s.lon)]);
                    setQuery(s.display_name.split(",").slice(0, 2).join(","));
                    setShowSuggestions(false);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm hover:bg-surface"
                >
                  <div className="line-clamp-2 text-foreground/80">{s.display_name}</div>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1">
        <MapContainer
          center={center}
          zoom={16}
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer
            url="https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
            subdomains={["a", "b", "c", "d"]}
            maxZoom={19}
          />
          <TileLayer
            url="https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
            maxZoom={19}
          />
          <MapController center={center} onCenterChange={setCenter} />
        </MapContainer>

        {/* Center pin overlay */}
        <div className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center">
          <div className="mb-2 rounded-full border border-border bg-background/95 px-3 py-1 text-[11px] font-medium text-foreground/80 shadow-[var(--shadow-card)] backdrop-blur">
            Mova o mapa para ajustar
          </div>
          <div className="relative flex flex-col items-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elevated)] ring-4 ring-background">
              <MapPin className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="-mt-1 h-2 w-2 rounded-full bg-primary/25 blur-[2px]" />
          </div>
        </div>

        <button
          onClick={locate}
          disabled={locating}
          className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-105 disabled:opacity-70"
          aria-label="Usar minha localização"
        >
          {locating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LocateFixed className="h-5 w-5" />
          )}
        </button>

        {permissionDenied ? (
          <div className="absolute inset-x-3 bottom-3 z-[500] flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-xs text-foreground shadow-[var(--shadow-card)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <div className="font-semibold">Localização bloqueada</div>
              <div className="text-foreground/70">
                Habilite a permissão de localização no navegador ou busque o endereço no campo acima.
              </div>
            </div>
          </div>
        ) : null}
      </div>


      <div
        className="z-[500] border-t border-border bg-background px-4 pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="mb-3 flex items-start gap-3 rounded-2xl border border-border bg-surface p-3">
          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 text-sm">
            <div className="font-semibold text-foreground">
              {reverseData?.street
                ? `${reverseData.street}${reverseData.neighborhood ? `, ${reverseData.neighborhood}` : ""}`
                : "Endereço aproximado"}
            </div>
            <div className="line-clamp-1 text-xs text-foreground/55">
              {reverseData?.displayName ?? "Ajuste o pino no mapa"}
            </div>
          </div>
        </div>
        <Button
          size="lg"
          className={cn("h-12 w-full rounded-full text-base font-semibold")}
          disabled={!reverseData}
          onClick={() => reverseData && onConfirm(reverseData)}
        >
          Confirmar localização
        </Button>
      </div>
    </div>
  );
}
