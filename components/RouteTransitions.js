// components/RouteTransitions.js
"use client";
import { createContext, useContext, useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";

const Ctx = createContext(null);

export function RouteTransitionProvider({ children }) {
  const router = useRouter();
  const [overlay, setOverlay] = useState({
    show: false,
    message: "",
    subtext: "",
    mode: "card",       // "card" | "full"
    accent: "emerald",  // "emerald" | "red" | "sky" | "violet"
    progress: 0,        // 0..100
  });

  const timerRef = useRef(null);
  const routeWaiterRef = useRef(null);

  function clearProgressTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function animateProgress(minDurationMs) {
    clearProgressTimer();
    const started = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.min(95, Math.floor((elapsed / Math.max(1, minDurationMs)) * 95));
      setOverlay((s) => (s.show ? { ...s, progress: pct } : s));
    }, 100);
  }

  async function finishOverlay() {
    clearProgressTimer();
    setOverlay((s) => ({ ...s, progress: 100 }));
    await new Promise((r) => setTimeout(r, 250));
    setOverlay((s) => ({ ...s, show: false }));
  }

  // Espera o evento routeChangeComplete/routeChangeError
  function waitForRouteComplete() {
    if (routeWaiterRef.current) {
      routeWaiterRef.current.cleanup?.();
      routeWaiterRef.current = null;
    }

    let done = false;
    let resolver;
    const p = new Promise((res) => (resolver = res));

    const onComplete = () => {
      if (done) return;
      done = true;
      cleanup();
      resolver();
    };
    const onError = () => onComplete();

    router.events.on("routeChangeComplete", onComplete);
    router.events.on("routeChangeError", onError);

    const cleanup = () => {
      router.events.off("routeChangeComplete", onComplete);
      router.events.off("routeChangeError", onError);
    };

    routeWaiterRef.current = { promise: p, cleanup };
    return p;
  }

  // Mantém compatibilidade com o portal (agora com progresso e flag hideOnRouteComplete)
  function startWithModal(href, opts = {}) {
    const {
      message = "Carregando módulo",
      subtext = "aguarde",
      minDurationMs = 800,
      mode = "card",
      accent = "emerald",
      hideOnRouteComplete = false,
    } = opts;

    setOverlay({ show: true, message, subtext, mode, accent, progress: 0 });
    animateProgress(minDurationMs);

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const routeWait = hideOnRouteComplete ? waitForRouteComplete() : Promise.resolve();

    Promise.all([sleep(minDurationMs), router.push(href), routeWait])
      .catch(() => {})
      .finally(() => finishOverlay());
  }

  // Executa uma tarefa + (opcional) navega; pode esperar a rota completar
  async function startWithTask({
    message = "Processando…",
    subtext = "",
    minDurationMs = 800,
    mode = "card",
    accent = "emerald",
    task,                 // () => Promise
    navigateTo,           // string
    hideOnRouteComplete = false,
  } = {}) {
    setOverlay({ show: true, message, subtext, mode, accent, progress: 0 });
    animateProgress(minDurationMs);

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const routeWait = hideOnRouteComplete ? waitForRouteComplete() : Promise.resolve();

    try {
      await Promise.all([sleep(minDurationMs), (typeof task === "function" ? task() : null)]);
      if (navigateTo) {
        await router.push(navigateTo);
      }
      await routeWait;
    } finally {
      await finishOverlay();
    }
  }

  useEffect(() => {
    return () => {
      clearProgressTimer();
      if (routeWaiterRef.current) routeWaiterRef.current.cleanup?.();
    };
  }, []);

  return (
    <Ctx.Provider value={{ startWithModal, startWithTask, overlay, setOverlay }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRouteTransition() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRouteTransition must be used within RouteTransitionProvider");
  return ctx;
}
