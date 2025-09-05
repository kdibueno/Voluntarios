// pages/portal.js
import AuthGate from "../components/AuthGate";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, useCallback, useMemo } from "react";
import { auth, db } from "../lib/firebase";
import { ref, onValue } from "firebase/database";
import useRoles from "../lib/hooks/useRoles";
import AuthButton from "../components/AuthButton";
import { useRouteTransition } from "../components/RouteTransitions";
import Image from "next/image";
import { Bell, Clapperboard, CalendarDays, FastForward, ShieldCheck, Hammer } from "lucide-react";
import MusicPlayer from "../components/MusicPlayer";

export default function Portal() {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);
  const { roles } = useRoles(user);
  const { startWithModal } = useRouteTransition();

  // ---- Pendências de aprovação (só para admins) ----
  const [allUsers, setAllUsers] = useState({});
  const [showBellModal, setShowBellModal] = useState(false);

  useEffect(() => {
    if (!roles?.admin) return;
    const unsub = onValue(ref(db, "users"), (snap) => setAllUsers(snap.val() || {}));
    return () => unsub();
  }, [roles?.admin]);

  const pendingList = useMemo(() => {
    if (!roles?.admin) return [];
    return Object.entries(allUsers || {})
      .map(([id, v]) => ({ id, ...v }))
      .filter((u) => u?.approved === false);
  }, [allUsers, roles?.admin]);
  // -----------------------------------------------

  function Card({ title, desc, href, icon, status }) {
  const isEnabled = status === "enabled" || status === "production";

    const labelText =
      status === "enabled" ? "Disponível" :
      status === "production" ? "Em produção" :
      /*status === "production" ? "Em Produção" :
      */"Sem permissão";

    const labelClass =
      status === "enabled"
        ? "border-green-400/30 bg-green-500/10 text-white"
        : status === "production"
        ? "border-yellow-400/30 bg-yellow-500/10 text-white-300"
        : "border-white/5 bg-white/5";

    const hintText =
      status === "enabled" ? "Clique para entrar" :
      status === "production" ? "Clique para entrar" :
      /*status === "production" ? "Em breve disponível" :
      */"Contate um admin";

    const onClick = useCallback((e) => {
      if (!isEnabled) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      startWithModal(href, {
        message: "Carregando informações…",
        subtext: "Aguarde um instante",
        minDurationMs: 1000,
        mode: "card",
        accent: "emerald",
        hideOnRouteComplete: true,
      });
    }, [href, isEnabled]); // provider mantém estável

    return (
      <a
        href={isEnabled ? href : undefined}
        onClick={onClick}
        aria-disabled={!isEnabled}
        className={`
          group relative w-full
          transition-transform duration-200
          ${isEnabled ? "hover:-translate-y-1" : "cursor-not-allowed"}
        `}
      >
        {/* Borda gradiente */}
        <div
          className={`
            absolute inset-0 rounded-2xl
            bg-gradient-to-br from-emerald-600/30 via-emerald-700/20 to-emerald-500/30
            opacity-0 blur-xl transition-opacity duration-300
            ${isEnabled ? "group-hover:opacity-100" : "opacity-0"}
          `}
          aria-hidden="true"
        />
        {/* Card */}
        <div
          className={`
            relative rounded-2xl border p-6 shadow
            bg-black/30 border-white/10
            backdrop-blur-sm
            transition-colors
            ${isEnabled ? "group-hover:bg-white/10" : "opacity-75"}
          `}
        >
          <div className="flex items-center gap-4">
            <div
              className={`
                h-12 w-12 shrink-0 grid place-items-center rounded-xl
                bg-gradient-to-br from-emerald-600 to-emerald-700
                ring-1 ring-white/10 shadow
                ${isEnabled ? "" : "grayscale"}
              `}
            >
              <span className="text-white text-xl">{icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold truncate">{title}</h3>
              <p className="text-sm text-gray-300 mt-1 line-clamp-2">{desc}</p>
            </div>
          </div>

          {/* CTA / estado */}
          <div className="mt-5 flex items-center justify-between">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${labelClass}`}>
              {labelText}
            </span>
            <span
              className={`
                text-[11px] text-gray-400
                ${isEnabled ? "opacity-80 group-hover:opacity-100" : "opacity-60"}
              `}
            >
              {hintText}
            </span>
          </div>
        </div>
      </a>
    );
  }

  // Estados por módulo
  const statusOrganizador = roles.organizador ? "enabled" : "disabled";
  const statusCronograma  = roles.cronograma  ? "enabled" : "disabled";
  const statusAdmin       = roles.admin       ? "enabled" : "disabled";
  const statusDriver      = roles.treinamentos? "production" : "disabled";
  const statusAgenda      = roles.eventos     ? "production" : "disabled";

  return (
    <AuthGate>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-black via-emerald-950 to-emerald-900 text-white">
        {/* glows */}
        <div className="pointer-events-none absolute -top-36 -left-36 h-72 w-72 bg-emerald-600/20 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-36 -right-36 h-72 w-72 bg-emerald-700/20 blur-3xl rounded-full" />

        {/* Header */}
        <div className="backdrop-blur-xl bg-black/30 border-b border-white/10 relative z-[2000]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-full overflow-hidden ring-1 ring-white/10 bg-white/5">
                <Image
                  src="/voluntarios.png"
                  alt="Logo"
                  fill
                  sizes="36px"
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-none">Seja bem-vindo(a)</h1>
                <p className="text-xs text-gray-300">
                  você está logado como {user?.displayName || user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              {/* Sino de pendências — abre MODAL central */}
              {roles.admin && (
                <button
                  onClick={() => setShowBellModal(true)}
                  className="
                    inline-flex items-center gap-2
                    rounded-lg px-2.5 py-1
                    bg-white/10 hover:bg-white/20
                    ring-1 ring-white/10
                    text-white text-sm
                    transition
                    cursor-pointer
                  "
                  title="Solicitações de cadastro"
                  aria-label="Abrir notificações"
                >
                  <Bell className="w-5 h-5" />
                  {pendingList.length > 0 && (
                    <span className="ml-1 inline-flex min-w-[18px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold items-center justify-center ring-2 ring-black/30">
                      {pendingList.length > 99 ? "99+" : pendingList.length}
                    </span>
                  )}
                </button>
              )}

              {/* Atalho direto para /admin — ao lado do sino, só para admins */}
              {roles.admin && (
                <button
                  onClick={() => {
                    startWithModal("/admin", {
                      message: "Abrindo administração…",
                      subtext: "Carregando painel",
                      minDurationMs: 1200,
                      mode: "card",
                      accent: "emerald",
                      hideOnRouteComplete: true,
                    });
                  }}
                  className="
                    inline-flex items-center gap-2
                    rounded-lg px-2.5 py-1
                    bg-white/10 hover:bg-white/20
                    ring-1 ring-white/10
                    text-white text-sm
                    transition
                    cursor-pointer
                  "
                  title="Administração"
                  aria-label="Abrir Administração"
                >
                  <ShieldCheck className="w-5 h-5" />
                </button>
              )}

              <AuthButton user={user} />
            </div>
          </div>
        </div>

        {/* Grid */}
        <main className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <Card
              title="Treinamentos"
              desc="Ambiente de Treinamentos e Evolução para Voluntários."
              href="/treinamentos"
              status={statusDriver}
              icon={<FastForward size={28} strokeWidth={2} />}
            />

            <Card
              title="Escalas"
              desc="Escala semanal dos usuários por função desempenhada."
              href="/cronograma"
              status={statusCronograma}
              icon={<Hammer size={28} strokeWidth={2} />}
            />

            < Card
              title="Roteiro de Transmissão"
              desc="Criação e gerenciamento de roteiros e cenas."
              href="/"
              status={statusOrganizador}
              icon={<Clapperboard size={28} strokeWidth={2} />}
            />

            <Card
              title="Agenda de Eventos"
              desc="Cronograma de eventos anuais."
              href="/eventos"
              status={statusAgenda}
              icon={<CalendarDays size={28} strokeWidth={2} />}
            />
          </div>
        </main>

        {/* Player flutuante */}
        <MusicPlayer />

        {/* ===== MODAL CENTRAL DE NOTIFICAÇÕES ===== */}
        {showBellModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBellModal(false)}
            />
            {/* card */}
            <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-black/85 shadow-2xl ring-1 ring-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold">
                  Solicitações pendentes{" "}
                  {pendingList.length > 0 && `(${pendingList.length})`}
                </h3>
                <button
                  onClick={() => setShowBellModal(false)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-2 max-h-[60vh] overflow-y-auto space-y-2">
                {pendingList.length === 0 ? (
                  <div className="text-sm text-gray-300 px-1 py-2">
                    Sem solicitações pendentes.
                  </div>
                ) : (
                  pendingList.map((u) => (
                    <div
                      key={u.id}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-white/5"
                    >
                      <div className="text-sm font-medium truncate">
                        {u.displayName || u.email}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        {u.email}
                      </div>
                      <div className="text-[11px] text-emerald-300 mt-0.5">
                        Aguardando aprovação
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex items-center justify-end">
                <button
                  onClick={() => {
                    setShowBellModal(false);
                    startWithModal("/admin", {
                      message: "Abrindo administração…",
                      subtext: "Carregando painel",
                      minDurationMs: 1200,
                      mode: "card",
                      accent: "emerald",
                      hideOnRouteComplete: true,
                    });
                  }}
                  className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white ring-1 ring-black/20 text-sm"
                >
                  Ir para Administração
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
