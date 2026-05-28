import { useEffect, useState } from "react";

import { BattleArenaPage } from "./components/BattleArenaPage";
import { LoginPage } from "./components/LoginPage";
import type { Session } from "./types/game";

const SESSION_STORAGE_KEY = "ai-battle-royale.session";
const ADMIN_PASSWORD_STORAGE_KEY = "ai-battle-royale.admin-password";

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
      const adminPassword = window.sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
      return typeof adminPassword === "string" && adminPassword.length > 0
        ? {
            role: "admin",
            username: parsed.username,
            adminPassword,
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

export default function App() {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (session) {
      if (session.role === "admin") {
        window.localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            role: "admin",
            username: session.username,
          }),
        );
        window.sessionStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, session.adminPassword);
      } else {
        window.localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify(session),
        );
        window.sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
      }
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
    }
  }, [session]);

  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME?.trim() || "admin";

  const handleLogin = (nextSession: Session) => {
    setAuthNotice(null);
    setSession(nextSession);
  };

  const handleLogout = () => {
    setAuthNotice(null);
    setSession(null);
  };

  if (!session) {
    return (
      <main className="app-shell">
        <LoginPage
          adminUsername={adminUsername}
          notice={authNotice}
          onLogin={handleLogin}
        />
      </main>
    );
  }

  return (
    <BattleArenaPage
      session={session}
      onAuthExpired={(message) => {
        setSession(null);
        setAuthNotice(message);
      }}
      onLogout={handleLogout}
    />
  );
}
