// components/RouteTransitionOverlay.js
"use client";
import { Loader2 } from "lucide-react";
import { useRouteTransition } from "./RouteTransitions";

export default function RouteTransitionOverlay() {
  const { overlay } = useRouteTransition();
  if (!overlay?.show) return null;

  const { message, subtext, mode, progress, accent } = overlay;

  const accents = {
    emerald: {
      glow1: "bg-emerald-500/20",
      glow2: "bg-emerald-600/20",
      ring: "ring-emerald-400/25",
      dot: "bg-emerald-400",
      gradFrom: "from-emerald-500/20",
      gradVia: "via-emerald-400/10",
      gradTo: "to-emerald-500/20",
      text: "text-emerald-200",
      bar: "bg-emerald-500",
      barBack: "bg-emerald-500/20",
    },
    red: {
      glow1: "bg-rose-500/25",
      glow2: "bg-rose-600/20",
      ring: "ring-rose-400/25",
      dot: "bg-rose-400",
      gradFrom: "from-rose-500/20",
      gradVia: "via-rose-400/10",
      gradTo: "to-rose-500/20",
      text: "text-rose-200",
      bar: "bg-rose-500",
      barBack: "bg-rose-500/20",
    },
    sky: {
      glow1: "bg-sky-500/25",
      glow2: "bg-sky-600/20",
      ring: "ring-sky-400/25",
      dot: "bg-sky-400",
      gradFrom: "from-sky-500/20",
      gradVia: "via-sky-400/10",
      gradTo: "to-sky-500/20",
      text: "text-sky-200",
      bar: "bg-sky-500",
      barBack: "bg-sky-500/20",
    },
    violet: {
      glow1: "bg-violet-500/25",
      glow2: "bg-violet-600/20",
      ring: "ring-violet-400/25",
      dot: "bg-violet-400",
      gradFrom: "from-violet-500/20",
      gradVia: "via-violet-400/10",
      gradTo: "to-violet-500/20",
      text: "text-violet-200",
      bar: "bg-violet-500",
      barBack: "bg-violet-500/20",
    },
  }[accent || "emerald"];

  const isCard = mode === "card";
  const pct = Math.max(0, Math.min(100, Math.round(progress || 0)));

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* glows */}
      <div className={`pointer-events-none absolute -top-40 -left-32 h-72 w-72 blur-3xl rounded-full ${accents.glow1}`} />
      <div className={`pointer-events-none absolute -bottom-44 -right-32 h-72 w-72 blur-3xl rounded-full ${accents.glow2}`} />

      {/* card */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={[
            "relative overflow-hidden",
            "rounded-2xl border border-white/10 bg-black/70",
            "shadow-2xl ring-1", accents.ring,
            isCard ? "w-full max-w-sm px-5 py-4" : "w-full max-w-md px-7 py-6",
            "animate-scaleIn",
          ].join(" ")}
        >
          <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${accents.gradFrom} ${accents.gradVia} ${accents.gradTo} opacity-30`} />

          {/* top runner */}
          <div className="absolute left-0 right-0 top-0 h-0.5 overflow-hidden">
            <div className={`h-full w-1/3 animate-slideX ${accents.dot}`} />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-sm opacity-60 ${accents.glow1}`} />
                <div className="relative h-9 w-9 grid place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
                  <Loader2 className="h-4 w-4 animate-spin text-white/90" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-sm text-white/95 font-medium">{message || "Carregando…"}</div>
                {subtext ? <div className={`text-[11px] mt-0.5 ${accents.text}`}>{subtext}</div> : null}
              </div>
            </div>

            {/* progress bar */}
            <div className={`mt-3 h-2 rounded-full ${accents.barBack} overflow-hidden`}>
              <div
                className={`h-full ${accents.bar} transition-[width] duration-200`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* keyframes */}
      <style jsx>{`
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn { animation: scaleIn .18s ease-out both; }

        @keyframes slideX {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(240%); }
        }
        .animate-slideX { animation: slideX 1.2s linear infinite; }
      `}</style>
    </div>
  );
}
