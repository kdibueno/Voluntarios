import { useEffect, useState, useRef } from "react";
import { db, auth } from "../lib/firebase";
import {
  ref,
  onChildAdded,
  onChildRemoved,
  push,
  remove,
} from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { MessageSquare, X, Trash2 } from "lucide-react";

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // realtime
  useEffect(() => {
    const chatRef = ref(db, "chat");

    const handleAdd = (snap) => {
      const msg = { id: snap.key, ...snap.val() };
      setMessages((prev) => [...prev, msg]);
    };

    const handleRemove = (snap) => {
      setMessages((prev) => prev.filter((m) => m.id !== snap.key));
    };

    const unsubAdd = onChildAdded(chatRef, handleAdd);
    const unsubRemove = onChildRemoved(chatRef, handleRemove);

    return () => {
      unsubAdd();
      unsubRemove();
    };
  }, []);

  // autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim() || !user) return;

    await push(ref(db, "chat"), {
      text: newMsg.trim(),
      at: Date.now(),
      by: { uid: user.uid, name: user.displayName || user.email },
    });

    setNewMsg("");
  }

  async function deleteMessage(id, uid) {
    if (user?.uid !== uid) return;
    await remove(ref(db, `chat/${id}`));
  }

  return (
    <div
      className={`
        fixed right-2 bottom-7
        ${open ? "z-[10000]" : "z-[40]"}
      `}
    >
      {/* Balão (mesmo tamanho do player, sempre acima quando aberto) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center justify-center
          w-9 h-9 rounded-full
          bg-emerald-600 hover:bg-emerald-700
          ring-1 ring-black/30 shadow-lg
          text-white transition
          ${open ? "z-[10001]" : "z-[40]"}
          relative
        `}
        aria-label={open ? "Fechar chat" : "Abrir chat"}
      >
        {open ? <X size={18} /> : <MessageSquare size={18} />}
      </button>

      {/* Painel (muuuuito acima de tudo) */}
      {open && (
        <div
          className="
            absolute bottom-12 right-0
            w-80 max-h-[500px]
            flex flex-col
            rounded-2xl bg-black/90 border border-white/10
            shadow-2xl overflow-hidden
          "
          style={{ zIndex: 10010 }}
        >
          <div className="px-4 py-2 border-b border-white/10 bg-emerald-700/20 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Chat</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center">Nenhuma mensagem ainda.</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded-lg max-w-[80%] ${
                  m.by?.uid === user?.uid
                    ? "ml-auto bg-emerald-600/30 text-right"
                    : "mr-auto bg-white/10 text-left"
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium text-xs text-emerald-300 truncate">
                    {m.by?.name || "Anônimo"}
                  </span>
                  {m.by?.uid === user?.uid && (
                    <button
                      onClick={() => deleteMessage(m.id, m.by?.uid)}
                      className="text-red-400 hover:text-red-600 transition"
                      title="Excluir mensagem"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-white text-sm break-words">{m.text}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-white/10 flex items-center p-2 gap-2"
          >
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="
                flex-1 bg-black/40 border border-white/10 rounded
                px-3 py-2 text-sm text-white placeholder-gray-500
                focus:outline-none focus:ring-1 focus:ring-emerald-500
              "
            />
            <button
              type="submit"
              disabled={!newMsg.trim()}
              className="
                px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700
                text-sm text-white disabled:opacity-50
              "
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
