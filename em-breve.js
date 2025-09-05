// pages/em-breve.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import AuthGate from "../components/AuthGate";
import BackToPortalButton from "../components/BackToPortalButton";
import AuthButton from "../components/AuthButton";
import { Rocket, Hammer, Undo2 } from "lucide-react";
// mesmo hook de transição usado em BackToPortalButton
import { useRouteTransition } from "../components/RouteTransitions";

// Overlay fallback (spinner) — aparece se a rota trocar sem o modal do hook
function PageTransitionOverlay({ show, message = "Carregando..." }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
        <div className="text-sm text-gray-100">{message}</div>
      </div>
    </div>
  );
}

export default function EmBreve() {
  const router = useRouter();
  const { startWithModal } = useRouteTransition();

  const [leaving, setLeaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Fallback: mostra overlay se alguma navegação ocorrer sem o modal
  useEffect(() => {
    const start = () => setLeaving(true);
    const stop = () => setLeaving(false);
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    router.events.on("routeChangeError", stop);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
    };
  }, [router.events]);

  function goTreinamentos() {
    // usa o mesmo padrão visual das outras telas
    startWithModal("/treinamentos", {
      message: "Voltando para Treinamentos…",
      subtext: "Carregando conteúdos",
      minDurationMs: 800,
      mode: "card",
      accent: "emerald",
      hideOnRouteComplete: true,
    });
  }

  return (
    <AuthGate>
       <div className="min-h-screen bg-gradient-to-b from-red-950 via-red-900 to-red-900 text-white relative overflow-hidden">
        {/* glows */}
        <div className="pointer-events-none absolute -top-36 -left-36 h-72 w-72 bg-emerald-600/25 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-36 -right-36 h-72 w-72 bg-emerald-700/25 blur-3xl rounded-full" />

        {/* Header */}
        <div className="backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-full overflow-hidden ring-1 ring-white/10 bg-white/5">
                <Image src="/voluntarios.png" alt="Logo" fill sizes="36px" className="object-contain p-0.5" priority />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-none">Em desenvolvimento</h1>
                <p className="text-[11px] text-gray-300">Voltamos logo com novidades 🚀</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BackToPortalButton label="Portal" message="Voltando ao portal…" />
              <AuthButton />
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 ring-1 ring-white/10">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-black/30 p-4 ring-1 ring-white/10">
                <Hammer size={36} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
                  Página em desenvolvimento
                </h2>
                <p className="text-sm md:text-base text-gray-200 mt-2">
                  Estamos trabalhando nesta área. Em breve você verá novidades por aqui. Obrigado pela paciência!
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">

                  {/* opcional: link direto (sem modal) */}
                                <Link
                                  href="/treinamentos"
                                  aria-label="Ir para Treinamentos"
                                  title="Treinamentos"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    startWithModal("/treinamentos", {
                                      message: "Voltando para Treinamentos…",
                                      subtext: "Carregando conteúdos",
                                      minDurationMs: 800,
                                      mode: "card",
                                      accent: "emerald",
                                      hideOnRouteComplete: true,
                                    });
                                  }}
                                  className="
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg
                                    bg-emerald-600/90 hover:bg-emerald-600
                                    text-white text-sm font-medium
                                    shadow ring-1 ring-black/20
                                    transition disabled:opacity-60 disabled:cursor-not-allowed
                                    focus:outline-none focus:ring-2 focus:ring-emerald-400/40
                                    cursor-pointer
                                  "
                                >
                                  <Undo2 size={18} strokeWidth={2} />
                                </Link>

                </div>
              </div>
            </div>
          </div>
        </main>

        {/* overlay de transição (fallback) */}
        <PageTransitionOverlay show={leaving} message={msg} />
      </div>
    </AuthGate>
  );
}
