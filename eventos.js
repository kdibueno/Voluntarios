// pages/em-breve.js
import Image from "next/image";
import AuthGate from "../components/AuthGate";
import BackToPortalButton from "../components/BackToPortalButton";
import AuthButton from "../components/AuthButton";
import { Rocket, Hammer } from "lucide-react";

export default function EmBreve() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-b from-red-950 via-red-900 to-red-900 text-white relative overflow-hidden">
        {/* glows */}
        <div className="pointer-events-none absolute -top-36 -left-36 h-72 w-72 bg-emerald-600/20 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-36 -right-36 h-72 w-72 bg-emerald-700/20 blur-3xl rounded-full" />

        {/* Header */}
        <div className="backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-full overflow-hidden ring-1 ring-white/10 bg-white/5">
                <Image src="/voluntarios.png" alt="Logo" fill sizes="36px" className="object-contain p-0.5" priority />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-none">Eventos</h1>
                <p className="text-[11px] text-gray-300">Nossa agenda anual de eventos</p>
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
                  Nenhum Evento Disponível
                </h2>
                <p className="text-sm md:text-base text-gray-200 mt-2">
                  Estamos trabalhando nesta área, e em breve você verá novidades por aqui.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer note */}
        <div className="max-w-7xl mx-auto px-4 pb-8 text-center text-[11px] text-gray-400">
          <div className="inline-flex items-center gap-1">
            <Rocket size={14} /> <span>Voltamos logo com novidades</span>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
