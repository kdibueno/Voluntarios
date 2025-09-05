// components/BackToPortalButton.js
"use client";
import { useState } from "react";
import { Home } from "lucide-react";
import { useRouteTransition } from "./RouteTransitions";

export default function BackToPortalButton({
  message = "Voltando ao portal…",
  href = "/portal",
}) {
  const [clicking, setClicking] = useState(false);
  const { startWithModal } = useRouteTransition();

  const handleClick = () => {
    if (clicking) return;
    setClicking(true);

    startWithModal(href, {
      message: "Carregando menus...",
      subtext: "Aguarde um instante",
      minDurationMs: 1000,
      mode: "card",
      accent: "emerald",
      hideOnRouteComplete: true, // <- só some quando /portal montar
    });

    setTimeout(() => setClicking(false), 1000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={clicking}
      className="
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        bg-emerald-600/90 hover:bg-emerald-600
        text-white text-sm font-medium
        shadow ring-1 ring-black/20
        transition disabled:opacity-60 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-emerald-400/40
        cursor-pointer
      "
      title="Voltar ao Portal"
    >
      <Home className="h-4 w-4" />
    </button>
  );
}
