// components/MusicPlayer.js
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Music2, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
} from "lucide-react";

/* ====== PASTAS/FAIXAS (ajuste conforme seu /public/music) ====== */
const FallbackGenres = {
  Infantil: [
    { src: "/music/Infantil/Aline Barros - Dança do Pinguim.mp3", title: "Aline Barros - Dança do Pinguim", desc: "Faixa de exemplo" },
    { src: "/music/louvor/faixa2.mp3", title: "Louvor 2" },
  ],
  louvor: [
    { src: "/music/louvor/faixa1.mp3", title: "Louvor 1" },
    { src: "/music/louvor/faixa2.mp3", title: "Louvor 2" },
  ],
  instrumental: [
    { src: "/music/instrumental/faixa1.mp3", title: "Piano 1" },
    { src: "/music/instrumental/faixa2.mp3", title: "Piano 2" },
  ],
  kids: [{ src: "/music/kids/faixa1.mp3", title: "Kids 1" }],
};

const GENRE_LABEL = {
  Infantil: "Infantil",
  louvor: "Louvor",
  instrumental: "Instrumental",
  kids: "Kids",
};

const DEFAULT_GENRE = ""; // ← começa sem nada selecionado

/* ====== PORTAL ROOT ====== */
function usePortalRoot() {
  const [root, setRoot] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let el = document.getElementById("music-player-portal");
    if (!el) {
      el = document.createElement("div");
      el.id = "music-player-portal";
      document.body.appendChild(el);
    }
    setRoot(el);
  }, []);
  return root;
}

export default function MusicPlayer({
  // offsets para ficar NO CANTO DIREITO e logo ABAIXO do chat
  offsetRight = 8,       // px da borda direita
  offsetBottom = 20,     // px da borda inferior
  chatBubbleHeight = 56, // altura do balão do chat (para não colidir)
}) {
  const portalRoot = usePortalRoot();

  const [open, setOpen] = useState(false);
  const [genre, setGenre] = useState(DEFAULT_GENRE); // "" no início
  const [tracks, setTracks] = useState([]);
  const [current, setCurrent] = useState(0);

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);

  // Carrega lista do gênero (tenta manifest.json, senão usa fallback)
  useEffect(() => {
    let mounted = true;
    (async () => {
      // sem gênero → não carrega nada
      if (!genre) {
        if (mounted) {
          setTracks([]);
          setCurrent(0);
          setIsPlaying(false);
          setCurTime(0);
          setDuration(0);
          // pausa se algo estiver tocando
          try { audioRef.current?.pause(); } catch {}
        }
        return;
      }

      try {
        const res = await fetch(`/music/${genre}/manifest.json`, { cache: "no-store" });
        if (res.ok) {
          const list = await res.json();
          if (mounted && Array.isArray(list) && list.length) {
            setTracks(list);
            setCurrent(0);
            setIsPlaying(false);
            setCurTime(0);
            setDuration(0);
            return;
          }
        }
        if (mounted) {
          setTracks(FallbackGenres[genre] || []);
          setCurrent(0);
          setIsPlaying(false);
          setCurTime(0);
          setDuration(0);
        }
      } catch {
        if (mounted) {
          setTracks(FallbackGenres[genre] || []);
          setCurrent(0);
          setIsPlaying(false);
          setCurTime(0);
          setDuration(0);
        }
      }
    })();
    return () => { mounted = false; };
  }, [genre]);

  // Eventos do <audio>
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      audio.volume = muted ? 0 : volume;
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    };
    const onTime = () => setCurTime(audio.currentTime || 0);
    const onEnded = () => handleNext();

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isPlaying, volume, muted]);

  // Volume/mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const curTrack = tracks[current] || null;

  async function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio || !curTrack) return; // sem faixa válida não faz nada

    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("Falha ao tocar áudio:", err);
      setIsPlaying(false);
    }
  }

  function handlePrev() {
    if (!tracks.length) return;
    setCurrent((i) => (i - 1 + tracks.length) % tracks.length);
    setCurTime(0);
  }

  function handleNext() {
    if (!tracks.length) return;
    setCurrent((i) => (i + 1) % tracks.length);
    setCurTime(0);
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  const progress = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, Math.max(0, (curTime / duration) * 100));
  }, [curTime, duration]);

  function onSeek(e) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const pct = Number(e.target.value) / 100;
    const t = pct * duration;
    audio.currentTime = isFinite(t) ? t : 0;
    setCurTime(audio.currentTime);
  }

  // estilos *inline* no canto DIREITO, logo acima do chat
  const fabStyle = {
    position: "fixed",
    right: `${offsetRight}px`,
    bottom: `${offsetBottom + chatBubbleHeight}px`,
    zIndex: 100,
  };
  const panelStyle = {
    position: "fixed",
    right: `${offsetRight}px`,
    bottom: `${offsetBottom + chatBubbleHeight + 60}px`,
    zIndex: 100,
  };

  const ui = (
    <>
      <audio
        ref={audioRef}
        src={genre && curTrack?.src ? curTrack.src : undefined}
        preload="metadata"
      />

      {/* FAB: bolinha menor com animações quando tocando e fechado */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={fabStyle}
        className={`
          relative overflow-visible
          h-9 w-9 rounded-full grid place-items-center
          bg-emerald-700 hover:bg-emerald-600
          text-white shadow-lg ring-1 ring-black/20
          transition transform hover:-translate-y-0.5
          ${isPlaying && !open ? "mp-wiggle mp-pulse" : ""}
        `}
        title="Abrir Player"
        aria-label="Abrir Player"
      >
        {isPlaying && !open ? (
          <span className="pointer-events-none absolute inset-0 rounded-full mp-ring" />
        ) : null}

        <div className="relative">
          {isPlaying && !open ? (
            <div className="flex items-end gap-[2px] h-4">
              <span className="mp-bar bar1" />
              <span className="mp-bar bar2" />
              <span className="mp-bar bar3" />
            </div>
          ) : (
            <Music2 className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Painel */}
      {open && (
        <div
          style={panelStyle}
          className="w-[92vw] max-w-sm rounded-2xl overflow-hidden border border-white/10 bg-black/80 backdrop-blur shadow-2xl animate-[fadeIn_160ms_ease-out]"
        >
          <div className="px-4 pt-3 pb-2 border-b border-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white">Player</div>
              <button
                onClick={() => setOpen(false)}
                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 ring-1 ring-white/10 text-gray-200"
              >
                Fechar
              </button>
            </div>
            <div className="mt-2">
              <label className="text-[11px] text-gray-400 mr-2">Gênero:</label>
              <select
                className="bg-black/50 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                value={genre}
                onChange={(e) => {
                  setGenre(e.target.value);
                  setIsPlaying(false);
                  setCurTime(0);
                  try { audioRef.current?.pause(); } catch {}
                }}
              >
                <option value="">Selecione…</option>
                {Object.keys(FallbackGenres).map((g) => (
                  <option key={g} value={g}>
                    {GENRE_LABEL[g] || g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="min-h-[40px]">
              <div className="text-sm font-medium text-white truncate">
                {curTrack?.title || (genre ? "—" : "Selecione um gênero")}
              </div>
              <div className="text-[11px] text-gray-400 truncate">
                {curTrack?.desc ||
                  (curTrack?.src
                    ? curTrack.src.split("/").pop()
                    : genre
                      ? "Selecione uma faixa e toque"
                      : "Nenhum gênero selecionado")}
              </div>
            </div>

            <div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={progress}
                onChange={onSeek}
                className="w-full accent-emerald-500"
                disabled={!curTrack}
              />
              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                <span>{fmtTime(curTime)}</span>
                <span>{fmtTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handlePrev}
                disabled={!curTrack}
                className={`h-8 w-8 rounded-lg ring-1 ring-white/10 grid place-items-center ${
                  curTrack ? "bg-white/10 hover:bg-white/20" : "bg-white/5 opacity-50 cursor-not-allowed"
                }`}
                title="Anterior"
              >
                <SkipBack className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={!curTrack}
                className={`h-9 px-3 rounded-lg ring-1 ring-black/20 text-white font-medium ${
                  curTrack ? "bg-emerald-700 hover:bg-emerald-600" : "bg-emerald-700/50 opacity-60 cursor-not-allowed"
                }`}
                title={isPlaying ? "Pausar" : "Reproduzir"}
              >
                <div className="flex items-center gap-1.5">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="text-sm">{isPlaying ? "Pause" : "Play"}</span>
                </div>
              </button>

              <button
                onClick={handleNext}
                disabled={!curTrack}
                className={`h-8 w-8 rounded-lg ring-1 ring-white/10 grid place-items-center ${
                  curTrack ? "bg-white/10 hover:bg-white/20" : "bg-white/5 opacity-50 cursor-not-allowed"
                }`}
                title="Próxima"
              >
                <SkipForward className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setMuted((m) => !m)}
                disabled={!genre}
                className={`h-8 w-8 rounded-lg ring-1 ring-white/10 grid place-items-center ${
                  genre ? "bg-white/10 hover:bg-white/20" : "bg-white/5 opacity-50 cursor-not-allowed"
                }`}
                title={muted ? "Ativar som" : "Silenciar"}
              >
                {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (v > 0 && muted) setMuted(false);
                  if (v === 0 && !muted) setMuted(true);
                }}
                className="flex-1 accent-emerald-500"
                disabled={!genre}
              />
            </div>
          </div>
        </div>
      )}

      {/* animações */}
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes mpWiggle {
          0%,100% { transform: rotate(0deg) translateY(0) }
          20% { transform: rotate(-4deg) translateY(-1px) }
          40% { transform: rotate(4deg) translateY(0) }
          60% { transform: rotate(-3deg) translateY(1px) }
          80% { transform: rotate(3deg) translateY(0) }
        }
        @keyframes mpPulse {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45) }
          70% { box-shadow: 0 0 0 10px rgba(16,185,129,0) }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0) }
        }
        .mp-ring { animation: mpPulse 1.6s ease-out infinite; border-radius: 9999px; }
        .mp-wiggle { animation: mpWiggle 1.4s ease-in-out infinite; }
        .mp-pulse { position: relative; }

        .mp-bar {
          display: inline-block;
          width: 2px;
          background: currentColor; color: white;
          border-radius: 2px; height: 6px;
          animation: mpBar 900ms ease-in-out infinite;
        }
        .mp-bar.bar1 { animation-delay: 0ms; }
        .mp-bar.bar2 { animation-delay: 150ms; }
        .mp-bar.bar3 { animation-delay: 300ms; }

        @keyframes mpBar {
          0%,100%{height:6px}
          25%{height:10px}
          50%{height:14px}
          75%{height:9px}
        }
      `}</style>
    </>
  );

  if (!portalRoot) return null;
  return createPortal(ui, portalRoot);
}
