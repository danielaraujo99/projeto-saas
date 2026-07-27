import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function ComingSoon() {
  const [now, setNow] = React.useState<string>("");
  React.useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNow(
        d.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090c] text-white antialiased">
      {/* Aurora / gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(255,110,64,0.55),transparent)] blur-3xl animate-blob" />
        <div className="absolute right-[-10%] top-[10%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(120,90,255,0.45),transparent)] blur-3xl animate-blob [animation-delay:-6s]" />
        <div className="absolute bottom-[-20%] left-[20%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,180,0.35),transparent)] blur-3xl animate-blob [animation-delay:-12s]" />
      </div>

      {/* Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      {/* Noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>\")",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-br from-orange-400 to-fuchsia-500" />
          </span>
          <span className="text-white/90">MenuAtlas</span>
        </div>
        <div className="hidden items-center gap-4 text-xs text-white/50 sm:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Em construção
          </span>
          <span className="tabular-nums">{now || "--:--:--"}</span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-orange-300" />
          Em breve · 2026
        </div>

        <h1 className="mt-8 text-balance text-[clamp(2.75rem,10vw,7.5rem)] font-black leading-[0.9] tracking-[-0.045em]">
          <span className="block bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent">
            Menu<span className="italic font-serif">Atlas</span>
          </span>
          <span className="mt-3 block bg-gradient-to-r from-orange-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent [background-size:200%_100%] animate-shine">
            está chegando.
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-balance text-base leading-relaxed text-white/60 sm:text-lg">
          A nova plataforma de cardápio digital, pedidos e gestão feita para
          restaurantes que não se contentam com o comum.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/demo"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.35)]"
          >
            Ver demonstração
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <a
            href="mailto:contato@menuatlas.com.br?subject=Quero%20saber%20mais%20sobre%20o%20MenuAtlas"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 backdrop-blur transition-colors hover:border-white/30 hover:bg-white/10"
          >
            Avise-me no lançamento
          </a>
        </div>

        {/* Feature strip */}
        <div className="mt-20 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur sm:grid-cols-4">
          {[
            { k: "Cardápio", v: "digital" },
            { k: "Pedidos", v: "em tempo real" },
            { k: "Gestão", v: "multi-loja" },
            { k: "Pagamentos", v: "integrados" },
          ].map((f) => (
            <div
              key={f.k}
              className="bg-[#0b0c10]/60 p-4 text-left transition-colors hover:bg-[#0b0c10]/90"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {f.k}
              </div>
              <div className="mt-1 text-sm font-medium text-white/90">{f.v}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 pb-8 text-xs text-white/40">
        <span>© {new Date().getFullYear()} MenuAtlas</span>
        <div className="flex items-center gap-4">
          <Link to="/termos" className="hover:text-white/70">Termos</Link>
          <Link to="/privacidade" className="hover:text-white/70">Privacidade</Link>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          33% { transform: translate3d(30px,-20px,0) scale(1.08); }
          66% { transform: translate3d(-25px,15px,0) scale(0.95); }
        }
        .animate-blob { animation: blob 18s ease-in-out infinite; }
        @keyframes shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-shine { animation: shine 6s linear infinite; }
      `}</style>
    </div>
  );
}
