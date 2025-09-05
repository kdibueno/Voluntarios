// components/ReorderCameras.js
import { useEffect, useMemo, useState } from "react";

export default function ReorderCameras({
  items,                // array original de câmeras
  getId,                // (item) => string (id único)
  renderItem,           // (item) => JSX (seu card)
  storageKey = "cameraOrder",
  className = "grid grid-cols-1 sm:grid-cols-2 gap-6",
}) {
  const [order, setOrder] = useState([]);
  const [reorderMode, setReorderMode] = useState(false);

  // carrega ordem salva
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setOrder(saved);
    } catch {}
  }, [storageKey]);

  // salva ordem
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(order));
    } catch {}
  }, [order, storageKey]);

  const ordered = useMemo(() => {
    if (!order?.length) return items;
    const map = new Map(items.map((it) => [getId(it), it]));
    const first = order.map((id) => map.get(id)).filter(Boolean);
    const rest = items.filter((it) => !order.includes(getId(it)));
    return [...first, ...rest];
  }, [items, order, getId]);

  function move(idx, delta) {
    setOrder((prev) => {
      const arr = prev.length ? [...prev] : items.map(getId);
      const j = idx + delta;
      if (j < 0 || j >= arr.length) return prev.length ? prev : arr;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return arr;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={() => setReorderMode((v) => !v)}
          className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-sm ring-1 ring-white/10 transition"
        >
          {reorderMode ? "Concluir" : "Reordenar câmeras"}
        </button>
      </div>

      <div className={className}>
        {ordered.map((item, i) => {
          const id = getId(item);
          return (
            <div key={id} className="relative group">
              {reorderMode && (
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <button
                    onClick={() => move(i, -1)}
                    className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition"
                    title="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, +1)}
                    className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition"
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                </div>
              )}
              {renderItem(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
