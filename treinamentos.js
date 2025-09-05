// pages/treinamentos.js
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import AuthGate from "../components/AuthGate";
import BackToPortalButton from "../components/BackToPortalButton";
import AuthButton from "../components/AuthButton";
import { Video, Camera, Projector, Sparkles, Users, Smile } from "lucide-react";
import { useRouteTransition } from "../components/RouteTransitions"; // mesmo hook usado nas demais telas

const items = [
  { key: "boasvindas",  label: "Boas Vindas Voluntário",  href: "/em-breve", Icon: Smile,     desc: "Aqui inicia sua jornada." },
  { key: "transmissao", label: "Transmissão",             href: "/em-breve", Icon: Video,     desc: "Conteúdos e práticas para transmissão." },
  { key: "fotografia",  label: "Fotografia",              href: "/em-breve", Icon: Camera,    desc: "Treinos, presets e guias de fotografia." },
  { key: "projecao",    label: "Projeção",                href: "/em-breve", Icon: Projector, desc: "Operação, cenários e rotinas de projeção." },
  { key: "stories",     label: "Stories",                 href: "/em-breve", Icon: Sparkles,  desc: "Roteiros e padrões para stories e reels." },
  { key: "apoio",       label: "Apoio",                   href: "/em-breve", Icon: Users,     desc: "Procedimentos e checklists da equipe de apoio." },
];

/* ===== Overlay de transição (fallback spinner) ===== */
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

/* ===== Card com interceptação de clique para mostrar o modal ===== */
function Card({ href, Icon, title, desc, onNavigate }) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onNavigate?.(href, `Abrindo ${title}…`);
      }}
      className="group rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/10 transition cursor-pointer block min-h-[128px] md:min-h-[156px]"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-black/30 p-3.5 md:p-4 ring-1 ring-white/10 group-hover:ring-white/20 shrink-0">
          <Icon size={32} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-lg md:text-xl font-semibold leading-tight">{title}</div>
          <div className="text-sm md:text-base text-gray-300 mt-1 line-clamp-2">{desc}</div>
        </div>
      </div>
    </Link>
  );
}

export default function Treinamentos() {
  const router = useRouter();
  const { startWithModal } = useRouteTransition();

  // fallback overlay (só aparece se a navegação ocorrer sem o modal customizado)
  const [leaving, setLeaving] = useState(false);
  const [msg, setMsg] = useState("");
  const usingModalRef = useRef(false);

  useEffect(() => {
    const start = () => { if (!usingModalRef.current) setLeaving(true); };
    const stop  = () => { setLeaving(false); usingModalRef.current = false; };
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    router.events.on("routeChangeError", stop);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
    };
  }, [router.events]);

  function handleNavigate(href, message) {
    usingModalRef.current = true; // evita que o fallback apareça por cima do modal
    startWithModal(href, {
      message: message || "Carregando…",
      subtext: "Carregando",
      minDurationMs: 800,
      mode: "card",
      accent: "emerald",
      hideOnRouteComplete: true,
    });
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-900 to-emerald-800 text-white relative overflow-hidden">
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
                <h1 className="text-lg font-semibold leading-none">Treinamentos</h1>
                <p className="text-[11px] text-gray-300">Selecione uma trilha para começar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BackToPortalButton label="Portal" message="Voltando ao portal…" />
              <AuthButton />
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 xl:gap-6">
            {items.map((it) => (
              <Card
                key={it.key}
                href={it.href}
                Icon={it.Icon}
                title={it.label}
                desc={it.desc}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </main>

        {/* Overlay de transição (fallback) */}
        <PageTransitionOverlay show={leaving} message={msg} />
      </div>
    </AuthGate>
  );
}
