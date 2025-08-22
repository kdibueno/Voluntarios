// pages/cronograma.js
import AuthGate from "../components/AuthGate";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
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
  { key: "diretorVmix",     label: "Diretor(a) de vMix" },
  { key: "cam5Central",     label: "Câmera 5 - Central" },
  { key: "cam6LateralDir",  label: "Câmera 6 - Lateral Direita" },
  { key: "cam7LateralEsq",  label: "Câmera 7 - Lateral Esquerda" },
  { key: "camMovel",        label: "Câmera Móvel" },
  { key: "diretorApoio",    label: "Diretor(a) de Apoio" },
  { key: "apoio1",          label: "Equipe de Apoio 1" },
  { key: "apoio2",          label: "Equipe de Apoio 2" },
  { key: "apoio3",          label: "Equipe de Apoio 3" },
  { key: "apoio4",          label: "Equipe de Apoio 4" },
  { key: "apoio5",          label: "Equipe de Apoio 5" },
];

const SLOT_STYLES = {
  diretorCena:     { bg: "bg-orange-500/10",  ring: "ring-orange-500/30",  label: "text-orange-200",  chip: "bg-orange-600/80 text-white",   border: "border-orange-500/30" },
  diretorVmix:     { bg: "bg-violet-500/10",  ring: "ring-violet-500/30",  label: "text-violet-200",  chip: "bg-violet-600/80 text-white",   border: "border-violet-500/30" },
  cam5Central:     { bg: "bg-sky-500/10",     ring: "ring-sky-500/30",     label: "text-sky-200",     chip: "bg-sky-600/80 text-white",      border: "border-sky-500/30" },
  cam6LateralDir:  { bg: "bg-sky-500/10",  ring: "ring-sky-500/30",  label: "text-sky-200",  chip: "bg-sky-600/80 text-white",   border: "border-sky-500/30" },
  cam7LateralEsq:  { bg: "bg-sky-500/10",    ring: "ring-sky-500/30",    label: "text-sky-200",    chip: "bg-sky-600/80 text-white",     border: "border-sky-500/30" },
  camMovel:        { bg: "bg-sky-500/10",    ring: "ring-sky-500/30",    label: "text-sky-200",    chip: "bg-sky-600/80 text-white",     border: "border-sky-500/30" },
  diretorApoio:    { bg: "bg-emerald-500/10", ring: "ring-emerald-500/30", label: "text-emerald-200", chip: "bg-emerald-600/80 text-white",  border: "border-emerald-500/30" },
  apoio1:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-fuchsia-200", chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
  apoio2:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-fuchsia-200", chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
  apoio3:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-fuchsia-200", chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
  apoio4:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-fuchsia-200", chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
  apoio5:          { bg: "bg-fuchsia-500/10", ring: "ring-fuchsia-500/30", label: "text-fuchsia-200", chip: "bg-fuchsia-600/80 text-white",  border: "border-fuchsia-500/30" },
};

const LEGEND = [
  { key: "diretorCena", label: "Diretor(a) de Cena" },
  { key: "diretorVmix", label: "Diretor(a) de vMix" },
  { key: "cam5Central", label: "Câmera 5 - Central" },
  { key: "cam6LateralDir", label: "Câmera 6 - Lateral Direita" },
  { key: "cam7LateralEsq", label: "Câmera 7 - Lateral Esquerda" },
  { key: "camMovel", label: "Câmera Móvel" },
  { key: "diretorApoio", label: "Diretor(a) de Apoio" },
  { key: "apoio1", label: "Equipe de Apoio" },
];

/* ===================== UTIL ===================== */

function styleFor(key) {
  return SLOT_STYLES[key] || {
    bg: "bg-white/10",
    ring: "ring-white/10",
    label: "text-gray-300",
    chip: "bg-white/10 text-gray-100",
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
  const [selectedShift, setSelectedShift] = useState("morning");
  const [loadingData, setLoadingData] = useState(true);

  // modal de notas
  const [noteModal, setNoteModal] = useState({ open: false, dayKey: "", shiftKey: "", slotKey: "", value: "" });

  // modal copiar
  const [copyModal, setCopyModal] = useState({ open: false, dayKey: "", shiftKey: "" , value: ""});

  // modal de seleção de usuário (menor)
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
      return () => {
        document.body.style.overflow = prev || "";
      };
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

  function dayHasUser(dayKey, uid, shiftKey) {
    if (!uid) return true;
    const dayData = byDay?.[dayKey]?.[shiftKey] || {};
    return DAY_SLOTS.some((s) => dayData?.[s.key] === uid);
  }
  const isFilterHit = (uid) => filterUid && uid === filterUid;

  /* ======= modal nota ======= */
  function openNoteModal(dayKey, shiftKey, slotKey, currentVal) {
    if (!canEdit) return;
    setNoteModal({ open: true, dayKey, shiftKey, slotKey, value: currentVal || "" });
  }
  function closeNoteModal() { setNoteModal((m) => ({ ...m, open: false })); }
  async function saveNoteModal() { const { dayKey, shiftKey, slotKey, value } = noteModal; await setNote(dayKey, shiftKey, slotKey, value); closeNoteModal(); }
  async function clearNoteModal() { const { dayKey, shiftKey, slotKey } = noteModal; await setNote(dayKey, shiftKey, slotKey, ""); closeNoteModal(); }

  /* ======= modal copiar ======= */
  function openCopyModal(dayKey, shiftKey) {
    if (!canEdit) return;
    setCopyModal({ open: true, dayKey, shiftKey, value: "" });
  }
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
    setAssignModal({
      open: true,
      dayKey,
      shiftKey,
      slotKey,
      search: "",
      selectedUid: "",
    });
  }
  function closeAssignModal() {
    setAssignModal((m) => ({ ...m, open: false }));
  }
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
      <div className="min-h-screen bg-gradient-to-b from-black via-emerald-950 to-emerald-900 text-white relative overflow-hidden">
        {/* glows */}
        <div className="pointer-events-none absolute -top-36 -left-36 h-72 w-72 bg-emerald-600/20 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-36 -right-36 h-72 w-72 bg-emerald-700/20 blur-3xl rounded-full" />

        {/* Header */}
        <div className="backdrop-blur-xl bg-black/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-full overflow-hidden ring-1 ring-white/10 bg-white/5">
                <Image src="/voluntarios.png" alt="Logo" fill sizes="36px" className="object-contain p-0.5" priority />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-none">Escala Semanal</h1>
                <p className="text-[11px] text-gray-300">{weekLabel}</p>
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
          <div className="rounded-xl border border-white/10 bg-black/30 p-2 shadow-xl overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[11px] text-gray-300 mr-1">Legenda:</span>
              {LEGEND.map((item) => {
                const st = styleFor(item.key);
                return (
                  <div key={item.key} className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${st.border} ${st.bg} ring-1 ${st.ring}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${st.chip.replace(" text-white","").replace(" text-black","")} ring-1 ring-black/20`} />
                    <span className={`text-[11px] ${st.label}`}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtros + navegação */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 shadow-xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              {/* filtro usuário */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-gray-300">Filtrar por usuário:</label>
                <select
                  className="dark-select bg-black/50 border border-white/10 rounded px-3 py-2 text-sm cursor-pointer hover:bg-white/5"
                  value={filterUid}
                  onChange={(e) => setFilterUid(e.target.value)}
                >
                  <option value="">Todos</option>
                  {userList.map((u) => (
                    <option key={u.uid} value={u.uid}>{u.name}</option>
                  ))}
                </select>
                {filterUid && (
                  <button onClick={() => setFilterUid("")} className="px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20 cursor-pointer">
                    Limpar
                  </button>
                )}
              </div>

              {/* turno */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-300">Turno:</span>
                <select
                  className="dark-select bg-black/50 border border-white/10 rounded px-3 py-2 text-sm cursor-pointer hover:bg-white/5"
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                >
                  {SHIFTS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Navegação fancy */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <button onClick={prevWeek} className="px-3 py-2 text-sm hover:bg-white/10 transition cursor-pointer">
                ← Semana
              </button>
              <div className="w-px h-6 bg-white/10" />
              <button onClick={goToday} className="px-3 py-2 text-sm hover:bg-white/10 transition cursor-pointer">
                Hoje
              </button>
              <div className="w-px h-6 bg-white/10" />
              <button onClick={nextWeek} className="px-3 py-2 text-sm hover:bg-white/10 transition cursor-pointer">
                Semana →
              </button>
            </div>
          </div>

          {loadingData && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-gray-300 animate-pulse">
              Carregando escala…
            </div>
          )}

          {/* Calendário — chaveado por selectedShift para animar re-render */}
          <div key={selectedShift} className="overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 md:gap-3 min-w-[980px]">
              {days.map((d, idx) => {
                const key = fmtYMD(d);
                const dayData = byDay?.[key] || {};
                const shiftKey = selectedShift;
                const data = dayData?.[shiftKey] || {};
                const notes = data?.notes || {};
                const weekday = WEEKDAY_LABELS[idx] || d.toLocaleDateString(undefined, { weekday: "short" });
                const isToday = fmtYMD(new Date()) === key;
                const visible = dayHasUser(key, filterUid, shiftKey);
                const updatedAt = data?.updatedAt;

                return (
                  <div
                    key={key}
                    className={`rounded-xl border border-white/10 bg-black/30 shadow-lg flex flex-col transition
                      ${isToday ? "ring-2 ring-emerald-500 border-emerald-500 " : ""}${filterUid ? (visible ? "" : " opacity-35") : ""} 
                      animate-[fadeIn_.28s_ease-out]`}
                  >
                    {/* cabeçalho do dia */}
                    <div className="px-2 pt-2 pb-1 sticky top-0 z-10 bg-black/50 backdrop-blur border-b border-white/10">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[9px] uppercase tracking-wide text-gray-400">{weekday}</div>
                          <div className="text-sm font-semibold truncate">{d.toLocaleDateString(undefined, { day: "2-digit"})}</div>
                          <div className="text-[9px] text-gray-500">{key}</div>
                        </div>

                        {(roles.editor || roles.admin) && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => openCopyModal(key, shiftKey)}
                              className="px-1.5 py-0.5 text-[10px] rounded-md bg-white/10 hover:bg-white/20 cursor-pointer"
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
                        {DAY_SLOTS.map((slot) => {
                          const assignedUid = data?.[slot.key] || "";
                          const assignedUser = assignedUid && userList.find((u) => u.uid === assignedUid);
                          const st = styleFor(slot.key);
                          const hit = isFilterHit(assignedUid);
                          const noteVal = notes?.[slot.key] || "";
                          const hasNote = !!noteVal?.trim();

                          return (
                            <div key={slot.key} className={`rounded-lg border ${st.border} ${st.bg} ring-1 ${st.ring} p-2`}>
                              {/* título do slot + ações */}
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className={`text-[10px] ${st.label} leading-tight truncate`}>{slot.label}</div>
                                <div className="flex items-center gap-1">
                                  {canEdit && (
                                    <button
                                      onClick={() => openNoteModal(key, shiftKey, slot.key, noteVal)}
                                      className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition
                                        ${hasNote ? "bg-amber-500/25 text-amber-200 hover:bg-amber-500/35" : "bg-white/10 hover:bg-white/20"}`}
                                      title={hasNote ? "Editar anotação (existe anotação)" : "Adicionar anotação"}
                                    >
                                      Nota
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
                                    className="flex-1 bg-black/50 border border-white/15 rounded px-3 py-0.5 text-sm text-left hover:bg-white/5 cursor-pointer"
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
                          <div className="pt-1 text-[9px] text-gray-500">
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
              <button onClick={closeNoteModal} className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-sm">
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
                className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-sm"
              >
                Ontem
              </button>
              <div className="flex items-center gap-2">
                <button onClick={closeCopyModal} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-sm">
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
              <button onClick={closeAssignModal} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-sm">
                Cancelar
              </button>
              <button
                onClick={confirmAssignModal}
                disabled={!assignModal.selectedUid}
                className={`px-3 py-2 rounded text-sm ${assignModal.selectedUid ? "bg-emerald-700 hover:bg-emerald-600 text-white" : "bg-white/10 text-gray-400 cursor-not-allowed"}`}
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

/* keyframes inline para a animação de entrada dos cards */
<style jsx global>{`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`}</style>

