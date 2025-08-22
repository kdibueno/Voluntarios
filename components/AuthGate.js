// components/AuthGate.js
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { auth, db } from "../lib/firebase";

export default function AuthGate({ children, requireRole }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Observa login
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Observa o perfil do usuário no RTDB
  useEffect(() => {
    if (!db || !user?.uid) return;
    setLoading(true);
    const unsub = onValue(ref(db, `users/${user.uid}`), (snap) => {
      setProfile(snap.val() || null);
      setLoading(false);
    });
    return () => unsub();
  }, [db, user?.uid]);

  const approved = !!profile?.approved;
  const hasRole = requireRole ? !!profile?.roles?.[requireRole] : true;

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-300">
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">Faça login para continuar.</div>
    );
  }

  if (!approved) {
    return (
      <div className="p-6">Seu cadastro aguarda aprovação.</div>
    );
  }

  if (!hasRole) {
    return (
      <div className="p-6">Você não tem permissão para acessar esta área.</div>
    );
  }

  return <>{children}</>;
}
