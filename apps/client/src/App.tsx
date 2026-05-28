import { useEffect, useState } from "react";

import { LoginPage } from "./components/LoginPage";
import type { Session } from "./types/game";

const SESSION_STORAGE_KEY = "ai-battle-royale.session";

function readStoredSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    const parsed = JSON.parse(rawSession) as Partial<Session>;
    if (
      typeof parsed.username !== "string" ||
      (parsed.role !== "spectator" && parsed.role !== "admin")
    ) {
      return null;
    }

    if (parsed.role === "admin") {
      return typeof parsed.adminPassword === "string"
        ? {
            role: "admin",
            username: parsed.username,
            adminPassword: parsed.adminPassword,
          }
        : null;
    }

    return {
      role: "spectator",
      username: parsed.username,
    };
  } catch {
    return null;
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME?.trim() || "admin";

  return (
    <main className="app-shell">
      <LoginPage
        adminUsername={adminUsername}
        session={session}
        onLogin={setSession}
        onLogout={() => setSession(null)}
      />
    </main>
  );
}

export default App;
