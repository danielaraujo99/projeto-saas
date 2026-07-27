import * as React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { HomePage } from "./index";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/$slug")({
  head: () => ({
    meta: [
      { title: "Cardápio digital" },
      { name: "description", content: "Peça pelo cardápio digital do restaurante." },
    ],
  }),
  component: SlugStorefront,
});

function SlugStorefront() {
  const { slug } = Route.useParams();
  const [state, setState] = React.useState<"loading" | "ok" | "notfound">("loading");

  React.useEffect(() => {
    let cancelled = false;
    supabase
      .from("restaurants")
      .select("slug, active")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setState(data ? "ok" : "notfound");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (state === "notfound") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Restaurante não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O endereço /{slug} não está disponível.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    );
  }
  return <HomePage />;
}
