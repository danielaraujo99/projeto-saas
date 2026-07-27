import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

const FEATURES = [
  {
    n: "01",
    k: "Cardápio",
    t: "Cardápio digital",
    d: "Design limpo, foto real do prato, categorias claras. Feito para converter em segundos.",
  },
  {
    n: "02",
    k: "Operação",
    t: "Pedidos em tempo real",
    d: "KDS, impressão automática e status ao vivo entre salão, cozinha e delivery.",
  },
  {
    n: "03",
    k: "Gestão",
    t: "Multi-loja e relatórios",
    d: "Uma conta, várias unidades. Faturamento, ticket médio e horário de pico em um só painel.",
  },
];

export function ComingSoon() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f1ea] text-[#111111] antialiased">
      {/* Serif face for the display */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
      />

      {/* Subtle paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      {/* Warm vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(180,120,60,0.10), transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1240px] flex-col px-6 sm:px-10">
        {/* Header */}
        <header className="flex items-center justify-between pt-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#111111] text-[#f5f1ea]">
              <span
                className="text-[15px] font-medium leading-none"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                M
              </span>
            </span>
            <span className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#111]/85">
              MenuAtlas
            </span>
          </div>
          <div className="hidden items-center gap-8 text-[12px] uppercase tracking-[0.22em] text-[#111]/50 sm:flex">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8a4a1b]" />
              Em desenvolvimento
            </span>
            <span>Lançamento 2026</span>
          </div>
        </header>

        <div className="mt-10 h-px w-full bg-[#111]/10" />

        {/* Hero */}
        <main className="flex flex-1 flex-col justify-center py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:gap-16">
            <div className="fade-up">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a4a1b]">
                Nº 01 — Prólogo
              </div>

              <h1
                className="mt-6 text-balance text-[clamp(3rem,10vw,8.5rem)] font-normal leading-[0.92] tracking-[-0.02em]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Uma nova forma de{" "}
                <em className="text-[#8a4a1b]">servir</em>
                <br />
                está a caminho.
              </h1>

              <p className="mt-8 max-w-xl text-[15px] leading-[1.7] text-[#111]/65 sm:text-base">
                MenuAtlas é a plataforma que reúne cardápio digital, pedidos e
                gestão em uma experiência única — pensada para restaurantes que
                tratam cada detalhe como parte do serviço.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/demo"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3.5 text-[13px] font-medium tracking-wide text-[#f5f1ea] transition-all hover:-translate-y-[1px] hover:bg-black"
                >
                  Ver demonstração
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <a
                  href="mailto:contato@menuatlas.com.br?subject=Quero%20saber%20mais%20sobre%20o%20MenuAtlas"
                  className="group inline-flex items-center gap-2 border-b border-[#111]/40 pb-1 text-[13px] font-medium tracking-wide text-[#111]/80 transition-colors hover:border-[#111] hover:text-[#111]"
                >
                  Avise-me no lançamento
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>

            {/* Side card — editorial "colophon" */}
            <aside className="fade-up [animation-delay:120ms]">
              <div className="rounded-sm border border-[#111]/12 bg-[#efe8dc]/70 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-[#111]/12 pb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#111]/45">
                  <span>Volume 01</span>
                  <span>MMXXVI</span>
                </div>
                <p
                  className="mt-4 text-[22px] leading-[1.25]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  “Cardápio é a{" "}
                  <em className="text-[#8a4a1b]">primeira</em> palavra que o
                  restaurante diz ao cliente.”
                </p>
                <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[#111]/55">
                  <span className="h-px w-8 bg-[#111]/30" />
                  Manifesto MenuAtlas
                </div>
              </div>
            </aside>
          </div>

          {/* Features row */}
          <div className="mt-24 grid gap-px overflow-hidden rounded-sm border border-[#111]/12 bg-[#111]/12 sm:mt-28 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.n}
                className="fade-up bg-[#f5f1ea] p-7 sm:p-8"
                style={{ animationDelay: `${200 + i * 90}ms` }}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-[#111]/45">
                  <span>{f.n}</span>
                  <span>{f.k}</span>
                </div>
                <h3
                  className="mt-6 text-[26px] leading-[1.1] tracking-[-0.01em]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {f.t}
                </h3>
                <p className="mt-3 text-[13.5px] leading-[1.65] text-[#111]/60">
                  {f.d}
                </p>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#111]/10 py-6 text-[11px] uppercase tracking-[0.22em] text-[#111]/45">
          <span>© {new Date().getFullYear()} MenuAtlas · Feito com cuidado.</span>
          <div className="flex items-center gap-6">
            <Link to="/termos" className="hover:text-[#111]">Termos</Link>
            <Link to="/privacidade" className="hover:text-[#111]">Privacidade</Link>
            <a href="mailto:contato@menuatlas.com.br" className="hover:text-[#111]">
              Contato
            </a>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          opacity: 0;
          animation: fadeUp 900ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}
