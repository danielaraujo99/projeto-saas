import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

export const Route = createFileRoute("/admin/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Bistrô Painel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/redefinir-senha`,
    });
    setBusy(false);
    setSent(true);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/admin/login"
          search={{}}
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        {sent ? (
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <MailCheck className="h-5 w-5" />
            </div>
            <h1 className="mt-3 text-xl font-bold text-slate-900">Verifique seu e-mail</h1>
            <p className="mt-1 text-sm text-slate-500">
              Enviamos um link para redefinir sua senha. O e-mail pode levar alguns minutos.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900">Recuperar senha</h1>
            <p className="mt-1 text-sm text-slate-500">
              Digite seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enviar link
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
