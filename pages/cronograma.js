// pages/cronograma.js
import AuthGate from "../components/AuthGate";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../lib/firebase";
import useRoles from "../lib/hooks/useRoles";
import { ref, onValue, update, set } from "firebase/database";
import AuthButton from "../components/AuthButton";
import BackToPortalButton from "../components/BackToPortalButton";
import Image from "next/image";
import MusicPlayer from "../components/MusicPlayer";

/* ===================== CONFIG ===================== */

const SHIFTS = [
  { key: "morning", label: "Manhã" },
  { key: "night",   label: "Noite"  },
];

const DAY_SLOTS = [
  { key: "diretorCena",     label: "Diretor(a) de Cena" },
  { key: "diretorObs",      label: "Diretor(a) de Obs" },
  { key: "cam5Central",     label: "Câmera 5" },
  { key: "cam6LateralDir",  label: "Câmera 6" },
  { key: "cam7LateralEsq",  label: "Câmera 7" },
  { key: "cam8central",     label: "Câmera 8" },
  { key: "camMovel",        label: "Câmera Móvel" },
  { key: "liderApoio",      label: "Lider de Apoio" },
  { key: "apoio1",          label: "Apoio 1" },
  { key: "apoio2",          label: "Apoio 2" },
  { key: "apoio3",          label: "Apoio 3" },
  { key: "apoio4",          label: "Apoio 4" },
  { key: "apoio5",          label: "Apoio 5" },
  { key: "fotografo",       label: "Fotógrafo" },
  { key: "diretorProjeção", label: "Projeção" },
];

const GROUPS = {
  transmissao: ['diretorCena','diretorObs','cam5Central','cam6LateralDir',/*'cam7LateralEsq'*/,'camMovel'],
  fotografia: ['fotografo',],
  projecao: ['diretorProjeção'],
  apoio: ['liderApoio','apoio1','apoio2','apoio3','apoio4','apoio5'],
};

const SLOT_STYLES = {
  diretorCena:     { bg: "bg-orange-500/50",  ring: "ring-orange-500/30",  label: "text-white",     chip: "bg-orange-600/50 text-white",   border: "border-orange-500/30" },
  diretorObs:      { bg: "bg-orange-500/50",  ring: "ring-orange-500/30",  label: "text-white",     chip: "bg-orange-600/50 text-white",   border: "border-orange-500/30" },
  cam5Central:     { bg: "bg-sky-500/30",     ring: "ring-sky-500/30",     label: "text-white",     chip: "bg-sky-600/50 text-white",      border: "border-sky-500/30" },
  cam6LateralDir:  { bg: "bg-sky-500/30",     ring: "ring-sky-500/30",     label: "text-white",     chip: "bg-sky-600/50 text-white",      border: "border-sky-500/30" },
/* cam7LateralEsq:  { bg: "bg-sky-500/10",     ring: "ring-sky-500/30",     label: "text-sky-200",     chip: "bg-sky-600/80 text-white",      border: "border-sky-500/30" },*/
  camMovel:        { bg: "bg-sky-500/30",     ring: "ring-sky-500/30",     label: "text-white",     chip: "bg-sky-600/50 text-white",      border: "border-sky-500/30" },
  liderApoio:      { bg: "bg-fuchsia-500/30", ring: "ring-fuchsia-500/30", label: "text-white",     chip: "bg-fuchsia-600/60 text-white",  border: "border-fuchsia-500/30" },
  apoio1:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-white",     chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
  apoio2:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-white",     chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
  apoio3:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-white",     chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
  apoio4:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-white",     chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
  apoio5:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-white",     chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
  fotografo:       { bg: "bg-red-500/30",     ring: "ring-red-500/30",     label: "text-white",     chip: "bg-red-600/50 text-white",      border: "border-red-500/30" },
  diretorProjeção: { bg: "bg-yellow-500/30",  ring: "ring-yellow-500/50",  label: "text-white",     chip: "bg-yellow-600/80 text-white",   border: "border-yellow-500/30" },
};

const LEGEND = [
  { key: "diretorCena", label: "Diretor(a) de Cena" },
  { key: "diretorObs", label: "Diretor(a) de Obs" },
  { key: "cam5Central", label: "Câmera 5" },
  { key: "cam6LateralDir", label: "Câmera 6" },
  { key: "cam7LateralEsq", label: "Câmera 7" },
  { key: "cam8aberta", label: "Câmera 8" },
  { key: "camMovel", label: "Câmera Móvel" },
  { key: "fotografo", label: "Fotografia" },
  { key: "diretorProjeção", label: "Projeção" },
  { key: "liderApoio", label: "Lider de Apoio" },
  { key: "apoio1", label: "Equipe de Apoio" },
];

/* ===================== UTIL ===================== */

function styleFor(key) {
  return SLOT_STYLES[key] || {
    bg: "bg-white/5",
    ring: "ring-white/10",
    label: "text-gray-300",
    chip: "bg-white/5 text-gray-100",
    border: "border-white/10",
  };
}

function fmtYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}-${m}-${y}`; // DD-MM-YYYY
}

function parseYMD(key) {
  const [day, month, year] = key.split("-").map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Domingo como primeiro dia
function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = dom
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ======= notas: helpers de leitura por usuário ======= */
function hashString(str = "") {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}
function noteKey(dayKey, shiftKey, slotKey, noteVal) {
  const txt = (noteVal || "").trim();
  if (!txt) return "";
  return `${dayKey}|${shiftKey}|${slotKey}|${hashString(txt)}`;
}
function getReadSet(uid) {
  if (typeof window === "undefined" || !uid) return new Set();
  try {
    const raw = localStorage.getItem(`cronograma.noteReads.${uid}`);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}
function saveReadSet(uid, set) {
  if (typeof window === "undefined" || !uid) return;
  try { localStorage.setItem(`cronograma.noteReads.${uid}` , JSON.stringify([...set])); } catch {}
}
function isNoteRead(uid, id) {
  if (!id) return true;
  const s = getReadSet(uid);
  return s.has(id);
}
function markNoteRead(uid, id) {
  if (!id) return;
  const s = getReadSet(uid);
  if (!s.has(id)) { s.add(id); saveReadSet(uid, s); }
}

/* ============ LiteSelect: dropdown custom 100% transparente ============ */
function LiteSelect({ value, onChange, options, className = "", align = "left", label = null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="dark-select bg-black/40 border border-white/10 rounded px-3 py-2 text-sm cursor-pointer hover:bg-white/10 flex items-center gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label || ""}
      >
        <span className="truncate">{current ? current.label : "Selecionar"}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-70">
          <path d="M7 7l3 3 3-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[180px] rounded-md border border-white/10 ring-1 ring-white/10 bg-black/100 backdrop-blur-0 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="listbox"
        >
          <ul className="max-h-64 overflow-auto py-1">
            {options.map((opt) => (
              <li
                key={`${opt.value}`}
                role="option"
                aria-selected={opt.value === value}
                className={`px-3 py-1.5 text-sm cursor-pointer select-none ${
                  opt.value === value ? "bg-white/10 text-white" : "text-slate-100 hover:bg-white/10"
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* animação de troca de turno */
function ShiftPane({ shiftKey, selectedShift, children }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, [shiftKey, selectedShift]);
  return (
    <div className={`transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
      {children}
    </div>
  );
}

/* ===================== PAGE ===================== */
export default function Cronograma() {
  const [user, setUser] = useState(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [byDay, setByDay] = useState({});
  const [users, setUsers] = useState({});
  const [filterUid, setFilterUid] = useState("");
  const [selectedShift, setSelectedShift] = useState("night");
  // comece SEM grupo selecionado para mostrar o empty-state
  const [activeGroup, setActiveGroup] = useState("");
  const visibleSlots = useMemo(() => {
    if (!activeGroup) return [];
    const keys = new Set(GROUPS[activeGroup] || []);
    if (!keys.size) return [];
    return DAY_SLOTS.filter((s) => keys.has(s.key));
  }, [activeGroup]);
  const [loadingData, setLoadingData] = useState(true);

  // === contraste alto (toggle + persistência) ===
  const [hiContrast, setHiContrast] = useState(false);
  useEffect(() => {
    const v = (typeof window !== 'undefined') ? localStorage.getItem("cronograma.hiContrast") : null;
    if (v === "1") setHiContrast(true);
  }, []);
  function toggleContrast() {
    setHiContrast((prev) => {
      const nv = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem("cronograma.hiContrast", nv ? "1" : "0");
      }
      return nv;
    });
  }

  // modais
  const [noteModal, setNoteModal] = useState({ open: false, dayKey: "", shiftKey: "", slotKey: "", value: "" });
  const [copyModal, setCopyModal] = useState({ open: false, dayKey: "", shiftKey: "" , value: ""});
  const [assignModal, setAssignModal] = useState({
    open: false,
    dayKey: "",
    shiftKey: "",
    slotKey: "",
    search: "",
    selectedUid: "",
  });

  // trava/destrava scroll da página quando QUALQUER modal estiver aberto
  useEffect(() => {
    const anyOpen = noteModal.open || copyModal.open || assignModal.open;
    if (anyOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev || ""; };
    }
  }, [noteModal.open, copyModal.open, assignModal.open]);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);
  const { roles } = useRoles(user);
  const canEdit = roles.editor || roles.admin;

  useEffect(() => {
    const unsub = onValue(ref(db, "scheduleByDay"), (snap) => {
      setByDay(snap.val() || {});
      setLoadingData(false);
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    const unsub = onValue(ref(db, "users"), (snap) => setUsers(snap.val() || {}));
    return () => unsub();
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  }), [weekStart]);

  const userList = useMemo(() => {
    const arr = Object.entries(users || {}).map(([uid, v]) => ({
      uid,
      name: v?.name || v?.displayName || v?.email || uid,
      email: v?.email || "",
    }));
    arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [users]);

  const userOptions = useMemo(() => [{ value: "", label: "Todos" }, ...userList.map(u => ({ value: u.uid, label: u.name }))], [userList]);
  const shiftOptions = useMemo(() => SHIFTS.map(s => ({ value: s.key, label: s.label })), []);

  /* ======= writes por TURNO ======= */
  async function setAssignment(dayKey, shiftKey, slotKey, uid) {
    if (!canEdit) return;
    await set(ref(db, `scheduleByDay/${dayKey}/${shiftKey}/${slotKey}`), uid || null);
    await update(ref(db), {
      [`scheduleByDay/${dayKey}/${shiftKey}/updatedAt`]: Date.now(),
      [`scheduleByDay/${dayKey}/${shiftKey}/updatedBy`] : user?.uid || "system",
    });
  }

  async function setNote(dayKey, shiftKey, slotKey, note) {
    if (!canEdit) return;
    await set(ref(db, `scheduleByDay/${dayKey}/${shiftKey}/notes/${slotKey}`), note || "");
    await update(ref(db), {
      [`scheduleByDay/${dayKey}/${shiftKey}/updatedAt`]: Date.now(),
      [`scheduleByDay/${dayKey}/${shiftKey}/updatedBy`] : user?.uid || "system",
    });
  }

  async function clearShift(dayKey, shiftKey) {
    if (!canEdit) return;
    if (!confirm(`Limpar todas as atribuições de ${dayKey} (${shiftKey === "morning" ? "manhã" : "noite"})?`)) return;
    const updates = {};
    for (const s of DAY_SLOTS) updates[`scheduleByDay/${dayKey}/${shiftKey}/${s.key}`] = null;
    updates[`scheduleByDay/${dayKey}/${shiftKey}/updatedAt`] = Date.now();
    updates[`scheduleByDay/${dayKey}/${shiftKey}/updatedBy`]  = user?.uid || "system";
    await update(ref(db), updates);
  }

  async function copyFrom(dayKey, shiftKey, fromKey) {
    if (!canEdit) return;
    const src = byDay?.[fromKey]?.[shiftKey] || {};
    const hasAny =
      DAY_SLOTS.some((s) => !!src?.[s.key]) ||
      !!(src?.notes && Object.keys(src.notes).length);
    if (!hasAny) {
      alert("Nada para copiar do dia selecionado.");
      return;
    }
    const updates = {};
    for (const s of DAY_SLOTS) {
      updates[`scheduleByDay/${dayKey}/${shiftKey}/${s.key}`] = src?.[s.key] || null;
    }
    const srcNotes = src?.notes || {};
    for (const k of Object.keys(srcNotes)) {
      updates[`scheduleByDay/${dayKey}/${shiftKey}/notes/${k}`] = srcNotes[k];
    }
    updates[`scheduleByDay/${dayKey}/${shiftKey}/updatedAt`] = Date.now();
    updates[`scheduleByDay/${dayKey}/${shiftKey}/updatedBy`]  = user?.uid || "system";
    await update(ref(db), updates);
  }

  /* ======= navegação semana ======= */
  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(startOfWeek(d)); }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(startOfWeek(d)); }
  function goToday()  { setWeekStart(startOfWeek(new Date())); }

  const weekLabel = useMemo(() => {
    const first = days[0], last = days[6];
    const fmt = (d) => d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    return `${fmt(first)} – ${fmt(last)}`;
  }, [days]);

function dayHasUser(dayKey, uid, shiftKey, groupKey) {
  if (!uid) return true;
  const dayData = byDay?.[dayKey]?.[shiftKey] || {};
  const groupSlots = GROUPS[groupKey] || [];
  if (groupSlots.length === 0) return false; // este grupo não tem slots configurados
  return groupSlots.some((k) => dayData?.[k] === uid);
}
  const isFilterHit = (uid) => filterUid && uid === filterUid;

  /* ======= modal nota ======= */
  function openNoteModal(dayKey, shiftKey, slotKey, currentVal) {
    if (!canEdit) return;
    setNoteModal({ open: true, dayKey, shiftKey, slotKey, value: currentVal || "" });
    const id = noteKey(dayKey, shiftKey, slotKey, currentVal);
    if (user?.uid && id) markNoteRead(user.uid, id);
  }
  function closeNoteModal() { setNoteModal((m) => ({ ...m, open: false })); }
  async function saveNoteModal() {
    const { dayKey, shiftKey, slotKey, value } = noteModal;
    await setNote(dayKey, shiftKey, slotKey, value);
    closeNoteModal();
  }
  async function clearNoteModal() {
    const { dayKey, shiftKey, slotKey } = noteModal;
    await setNote(dayKey, shiftKey, slotKey, "");
    closeNoteModal();
  }

  /* ======= modal copiar ======= */
  function openCopyModal(dayKey, shiftKey) { if (!canEdit) return; setCopyModal({ open: true, dayKey, shiftKey, value: "" }); }
  function closeCopyModal() { setCopyModal((m) => ({ ...m, open: false })); }
  async function doCopyNow() {
    const { dayKey, shiftKey, value } = copyModal;
    if (!value) return;
    const [yyyy, mm, dd] = value.split("-");
    const fromKey = `${dd}-${mm}-${yyyy}`;
    await copyFrom(dayKey, shiftKey, fromKey);
    closeCopyModal();
  }
  function setYesterdayInCopy() {
    const { dayKey } = copyModal;
    if (!dayKey) return;
    const d = parseYMD(dayKey);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setCopyModal((m0) => ({ ...m0, value: `${y}-${m}-${day}` }));
  }

  /* ======= modal selecionar usuário ======= */
  function openAssignModal(dayKey, shiftKey, slotKey) {
    if (!canEdit) return;
    setAssignModal({ open: true, dayKey, shiftKey, slotKey, search: "", selectedUid: "" });
  }
  function closeAssignModal() { setAssignModal((m) => ({ ...m, open: false })); }
  async function confirmAssignModal() {
    const { dayKey, shiftKey, slotKey, selectedUid } = assignModal;
    if (!selectedUid) return;
    await setAssignment(dayKey, shiftKey, slotKey, selectedUid);
    closeAssignModal();
  }

  const filteredAssignUsers = useMemo(() => {
    const q = assignModal.search.trim().toLowerCase();
    if (!q) return userList;
    return userList.filter((u) =>
      u.name.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    );
  }, [assignModal.search, userList]);

  /* ===================== RENDER ===================== */
  return (
    <AuthGate requireRole="cronograma">
      {/* fundo padrão e estável independentemente do grupo */}
      <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-emerald-900 to-emerald-800 text-white relative overflow-hidden ${hiContrast ? "contrast-high" : ""}`}>
        {/* glows fixos */}
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
                <h1 className="text-lg font-semibold leading-none">Escala Semanal</h1>
                <p className="text-[11px] text-gray-200">{weekLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BackToPortalButton label="Portal" message="Voltando ao portal…" />
              <AuthButton user={user} />
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-5 space-y-4">
          {/* Legenda */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-2 shadow-xl overflow-x-auto">
            <div className="flex items-center gap-7 min-w-max">
              <span className="text-[11px] text-gray-200 mr-1">Legenda:</span>
              {LEGEND.map((item) => {
                const st = styleFor(item.key);
                return (
                  <div key={item.key} className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${st.border} bg-white/5 ring-1 ${st.ring}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${st.chip.replace(" text-white","").replace(" text-black","")} ring-1 ring-black/20`} />
                    <span className={`text-[11px] ${st.label}`}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtros + navegação */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-2.5 shadow-xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              {/* filtro usuário */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-gray-200">Filtrar por usuário:</label>
                <LiteSelect
                  value={filterUid}
                  onChange={(v) => setFilterUid(v)}
                  options={userOptions}
                  label="Filtrar por usuário"
                />
                {filterUid && (
                  <button onClick={() => setFilterUid("")} className="px-3 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 cursor-pointer">
                    Limpar
                  </button>
                )}
              </div>

              {/* turno */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-200">Turno:</span>
                <LiteSelect
                  value={selectedShift}
                  onChange={(v) => setSelectedShift(v)}
                  options={shiftOptions}
                  label="Selecionar turno"
                />
              </div>
              <div className="flex items-center gap-2 md:ml-8 lg:ml-26">
                <span className="text-[11px] text-gray-200">Equipe:</span>
                {([["transmissao","Transmissão"],["fotografia","Fotografia"],["projecao","Projeção"],["apoio","Apoio"]]).map(([key,label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveGroup(key)}
                    aria-pressed={activeGroup===key}
                    className={`px-3 py-1 rounded-md text-sm ring-1 transition cursor-pointer
                      ${activeGroup===key ? 'bg-black text-white ring-black shadow-inner' : 'bg-black/30 text-gray-300 ring-white/10 hover:bg-white/10'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navegação fancy */}
            <div className="flex items-center bg-white/5 border border-white/15 rounded-xl overflow-hidden">
              <button onClick={prevWeek} className="px-3 py-2 text-sm hover:bg-white/10 transition cursor-pointer">
                ← Semana
              </button>
              <div className="w-px h-6 bg-white/5" />
              <button onClick={goToday} className="px-3 py-2 text-sm hover:bg-white/10 transition cursor-pointer">
                Hoje
              </button>
              <div className="w-px h-6 bg-white/5" />
              <button onClick={nextWeek} className="px-3 py-2 text-sm hover:bg-white/10 transition cursor-pointer">
                Semana →
              </button>
            </div>
          </div>

          {loadingData && (
            <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-gray-200 animate-pulse">
              Carregando escala…
            </div>
          )}

          {/* empty state quando nenhum grupo estiver selecionado */}
          {!activeGroup && (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-12 text-center shadow-xl">
              <h3 className="text-lg font-semibold">Escolha um grupo para visualizar a escala</h3>
              <p className="text-sm text-gray-300 mt-1">Use os botões acima (Transmissão, Fotografia, Projeção, Apoio).</p>
            </div>
          )}

          {/* Calendário — chaveado por selectedShift para animar re-render */}
          {activeGroup && (
            <div key={selectedShift} className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 md:gap-3 min-w-[980px] bg-transparent">
                {days.map((d, idx) => {
                  const key = fmtYMD(d);
                  const dayData = byDay?.[key] || {};
                  const shiftKey = selectedShift;
                  const data = dayData?.[shiftKey] || {};
                  const notes = data?.notes || {};
                  const weekday = WEEKDAY_LABELS[idx] || d.toLocaleDateString(undefined, { weekday: "short" });
                  const isToday = fmtYMD(new Date()) === key;
                  const visible = dayHasUser(key, filterUid, shiftKey, activeGroup);
                  const updatedAt = data?.updatedAt;

                  return (
                    <div
                      key={key}
                      className={`rounded-xl border border-white/15 bg-white/5 shadow-lg flex flex-col transition
                        ${isToday ? "ring-2 ring-emerald-500 border-emerald-500 " : ""}${filterUid ? (visible ? "" : " opacity-35") : ""} 
                        animate-[fadeIn_.28s_ease-out]`}
                    >
                      {/* cabeçalho do dia */}
                      <div className="px-2 pt-2 pb-1 sticky top-0 z-10 bg-white/5 backdrop-blur border-b border-white/15">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[9px] uppercase tracking-wide text-white">{weekday}</div>
                            <div className="text-sm font-semibold truncate">
                              {d.toLocaleDateString(undefined, { day: "2-digit"})}
                            </div>
                            <div className="text-[9px] text-white">{key}</div>
                          </div>

                          {(roles.editor || roles.admin) && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => openCopyModal(key, shiftKey)}
                                className="px-1.5 py-0.5 text-[10px] rounded-md bg-white/5 hover:bg-white/10 cursor-pointer"
                                title={`Copiar de outro dia para ${key} (${SHIFTS.find(s => s.key===shiftKey)?.label})`}
                              >
                                Copiar
                              </button>
                              <button
                                onClick={() => clearShift(key, shiftKey)}
                                className="px-1.5 py-0.5 text-[10px] rounded-md bg-red-500/70 hover:bg-red-500 text-white cursor-pointer"
                                title={`Limpar turno (${SHIFTS.find(s => s.key===shiftKey)?.label})`}
                              >
                                Limpar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* slots do turno */}
                      <ShiftPane shiftKey={shiftKey} selectedShift={selectedShift}>
                        <div className="px-2 pb-2 pt-1 space-y-1.5">
                          {visibleSlots.map((slot) => {
                            const assignedUid = data?.[slot.key] || "";
                            const assignedUser = assignedUid && userList.find((u) => u.uid === assignedUid);
                            const st = styleFor(slot.key);
                            const hit = isFilterHit(assignedUid);
                            const noteVal = notes?.[slot.key] || "";
                            const hasNote = !!noteVal?.trim();
                            const noteId = noteKey(key, shiftKey, slot.key, noteVal);
                            const unread = hasNote && user?.uid && !isNoteRead(user.uid, noteId);

                            return (
                              <div
                                key={slot.key}
                                className={`rounded-lg border ${st.border} ${st.bg} ring-1 ${st.ring} p-2`}
                              >
                                {/* título do slot + ações */}
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className={`text-[10px] ${st.label} leading-tight truncate`}>{slot.label}</div>
                                  <div className="flex items-center gap-1">
                                    {canEdit && (
                                      <button
                                        onClick={() => openNoteModal(key, shiftKey, slot.key, noteVal)} className={`relative inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] ring-1 transition ${unread ? "bg-black text-white ring-black" : "bg-white/70 hover:bg-white/50 text-black/90 ring-white/15 cursor-pointer"}`}
                                        title={hasNote ? "Editar anotação (existe anotação)" : "Adicionar anotação"}
                                      >
                                        Nota
                                        {unread && (
                                          <span
                                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white"
                                            title="Nota não lida"
                                            aria-label="Nota não lida"
                                          />
                                        )}
                                      </button>
                                    )}
                                    {canEdit && assignedUser && (
                                      <button
                                        onClick={() => setAssignment(key, shiftKey, slot.key, "")}
                                        className="w-6 h-6 rounded-full bg-red-500/70 hover:bg-red-500 text-white text-xs flex items-center justify-center cursor-pointer"
                                        title="Remover"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* nome / seletor */}
                                <div className="flex items-center gap-2">
                                  {assignedUser ? (
                                    <span
                                      className={`flex-1 text-[11px] px-2 py-1 rounded ${st.chip} ring-1 ${hit ? "ring-2 ring-white/60" : "ring-black/20"} truncate`}
                                      title={assignedUser.name}
                                    >
                                      {assignedUser.name}
                                    </span>
                                  ) : canEdit ? (
                                    <button
                                      onClick={() => openAssignModal(key, shiftKey, slot.key)}
                                      className="flex-1 bg-black/40 border border-white/15 rounded px-3 py-0.5 text-sm text-left hover:bg-white/10 cursor-pointer"
                                      title="Selecionar usuário"
                                    >
                                      Selecionar
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-gray-500 flex-1">—</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {updatedAt && (
                            <div className="pt-1 text-[9px] text-white text-center">
                              Atualizado em{" "}
                              {new Date(updatedAt).toLocaleString(undefined, {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      </ShiftPane>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DE NOTA */}
      {noteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeNoteModal} />
          <div className="relative w-full max-w-md max-h-[85vh] overflow-auto rounded-2xl border border-white/10 bg-black/80 p-4 shadow-2xl ring-1 ring-white/10">
            <h3 className="text-base font-semibold mb-2">Anotação</h3>
            <textarea
              rows={5}
              className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              value={noteModal.value}
              onChange={(e) => setNoteModal((m) => ({ ...m, value: e.target.value }))}
              placeholder="Digite a anotação para esta escala…"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={closeNoteModal} className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-sm">
                Cancelar
              </button>
              <button onClick={clearNoteModal} className="px-3 py-1.5 rounded bg-red-500/70 hover:bg-red-500 text-white text-sm">
                Limpar
              </button>
              <button onClick={saveNoteModal} className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-sm">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COPIAR */}
      {copyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeCopyModal} />
          <div className="relative w-full max-w-sm max-h-[85vh] overflow-auto rounded-2xl border border-white/10 bg-black/80 p-4 shadow-2xl ring-1 ring-white/10">
            <h3 className="text-base font-semibold">Copiar escala</h3>
            <p className="text-xs text-gray-300 mt-1 mb-3">
              Escolha o <strong>dia de origem</strong> (mesmo turno selecionado) para copiar para <strong>{copyModal.dayKey}</strong>.
            </p>

            <label className="text-xs text-gray-300">Dia de origem</label>
            <input
              type="date"
              className="w-full mt-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              value={copyModal.value}
              onChange={(e) => setCopyModal((m) => ({ ...m, value: e.target.value }))}
            />

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={setYesterdayInCopy}
                className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-sm"
              >
                Ontem
              </button>
              <div className="flex items-center gap-2">
                <button onClick={closeCopyModal} className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-sm">
                  Cancelar
                </button>
                <button
                  onClick={doCopyNow}
                  className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-sm"
                  disabled={!copyModal.value}
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SELECIONAR USUÁRIO (MENOR + SCROLL INTERNO) */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop e travamento de scroll já garantidos pelo useEffect */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAssignModal} />
          <div className="relative w-full max-w-sm max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl ring-1 ring-white/10">
            <h3 className="text-sm font-semibold">Selecionar usuário</h3>
            <p className="text-[11px] text-gray-300 mt-0.5 mb-2">
              Busque por <strong>nome</strong> ou <strong>e-mail</strong>.
            </p>

            <input
              autoFocus
              type="text"
              value={assignModal.search}
              onChange={(e) => setAssignModal((m) => ({ ...m, search: e.target.value }))}
              placeholder="Pesquisar…"
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && assignModal.selectedUid) {
                  confirmAssignModal();
                }
              }}
            />

            {/* Lista com rolagem própria */}
            <div className="mt-2 overflow-y-auto max-h-56 rounded-lg border border-white/10">
              {filteredAssignUsers.length === 0 ? (
                <div className="p-3 text-sm text-gray-400 text-center">Nenhum usuário encontrado.</div>
              ) : (
                <ul className="divide-y divide-white/10">
                  {filteredAssignUsers.map((u) => {
                    const active = assignModal.selectedUid === u.uid;
                    return (
                      <li
                        key={u.uid}
                        className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer
                          ${active ? "bg-emerald-600/20" : "hover:bg-white/10"}`}
                        onClick={() => setAssignModal((m) => ({ ...m, selectedUid: u.uid }))}
                        title={u.email}
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.name}</div>
                          {u.email && <div className="text-[11px] text-gray-400 truncate">{u.email}</div>}
                        </div>
                        {active && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-700 text-white">Selecionado</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={closeAssignModal} className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-sm">
                Cancelar
              </button>
              <button
                onClick={confirmAssignModal}
                disabled={!assignModal.selectedUid}
                className={`px-3 py-2 rounded text-sm ${assignModal.selectedUid ? "bg-emerald-700 hover:bg-emerald-600 text-white" : "bg-white/5 text-gray-400 cursor-not-allowed"}`}
              >
                Atribuir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player flutuante */}
      <MusicPlayer
        bubblePosition="bottom-right"
        genresRoot="/music"
        defaultGenre="louvor"
        zIndexBubble={30}
      />
    </AuthGate>
  );
}

/* keyframes + utilidades de contraste  */
<style jsx global>{`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  /* a classe .contrast-high eleva sutilmente opacidades e bordas para telas escuras */
  .contrast-high .bg-white\/10 { background-color: rgba(255,255,255,0.14) !important; }
  .contrast-high .border-white\/15 { border-color: rgba(255,255,255,0.24) !important; }
  .contrast-high .text-gray-200 { color: #e7e7e7 !important; }
  @media (prefers-contrast: more) {
    .bg-white\/10 { background-color: rgba(255,255,255,0.12); }
    .border-white\/15 { border-color: rgba(255,255,255,0.22); }
  }
`}</style>
