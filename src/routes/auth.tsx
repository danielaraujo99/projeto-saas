import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthGate } from "@/components/auth-gate";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Restaurante Demo" },
      { name: "description", content: "Entre ou crie sua conta no Restaurante Demo." },
      { property: "og:title", content: "Entrar — Restaurante Demo" },
      { property: "og:description", content: "Entre ou crie sua conta no Restaurante Demo." },
    ],
  }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Entrar</h1>
        </div>
      </header>
      <AuthGate
        open
        onOpenChange={(o) => !o && nav({ to: "/" })}
        onSuccess={() => nav({ to: "/" })}
      />
    </div>
  );
}
