// components/AuthButton.js
"use client";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { LogOut } from "lucide-react";
import { useRouteTransition } from "./RouteTransitions";

export default function AuthButton({ user }) {
  const [clicking, setClicking] = useState(false);
  const { startWithTask } = useRouteTransition();

  if (!user) return null;

  const handleLogout = async () => {
    if (clicking) return;
    setClicking(true);

    await startWithTask({
      message: "Saindo, aguarde",
      subtext: "Salvando seus dados com segurança",
      minDurationMs: 5000,
      mode: "card",
      accent: "red",
      task: () => signOut(auth),
      navigateTo: "/login",
      hideOnRouteComplete: true, // <- só some quando /login montar
    });

    setClicking(false);
  };

  return (
    <button
      onClick={handleLogout}
      disabled={clicking}
      className="
        flex items-centerpx-3 py-1.5 rounded-lg
        bg-red-600/85 hover:bg-red-600
        text-white text-sm font-medium
        shadow ring-1 ring-black/20
        transition disabled:opacity-60 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-red-400/40
        cursor-pointer
      "
    >
      <LogOut className="h-4 w-10" />
      <span>{clicking ? "Saindo…" : ""}</span>
    </button>
  );
}
