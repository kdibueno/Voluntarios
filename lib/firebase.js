// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,   // <- sessão (até fechar a aba/janela)
  // browserLocalPersistence,  // <- persistente (mesmo após fechar o navegador)
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// ⚙️ Config do Firebase via variáveis de ambiente públicas (Next.js)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // ex: "projeto-diretor.appspot.com"
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

// Evita reinicializar em hot-reload / múltiplas importações
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Módulos que você já usa no projeto
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// ✅ Persistência de sessão (somente no cliente)
if (typeof window !== "undefined") {
  setPersistence(auth, browserSessionPersistence).catch((err) => {
    // Não quebre a app se falhar (ex.: modos restritos do navegador)
    console.warn("Falha ao definir persistência de sessão do Firebase Auth:", err);
  });

  // — Se quiser regras diferentes por ambiente, troque acima por algo assim:
  // const persistence = process.env.NODE_ENV === "production"
  //   ? browserSessionPersistence
  //   : browserSessionPersistence; // ou browserLocalPersistence
  // setPersistence(auth, persistence).catch(console.warn);
}

export default app;
