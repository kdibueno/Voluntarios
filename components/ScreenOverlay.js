// components/ScreenOverlay.js
import { Loader2 } from "lucide-react";

export default function ScreenOverlay({ text = "Carregando…" }) {
  return (
    <div className="fixed inset-0 z-[9999]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* card */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/80 shadow-2xl ring-1 ring-white/10 p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-white/90" />
          <div className="text-sm text-white/90">{text}</div>
        </div>
      </div>
    </div>
  );
}
