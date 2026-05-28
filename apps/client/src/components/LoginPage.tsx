import { useEffect, useState, type FormEvent } from "react";

import type { Session } from "../types/game";

type LoginPageProps = {
  adminUsername: string;
  session: Session | null;
  onLogin: (session: Session) => void;
  onLogout: () => void;
};

export function LoginPage({
  adminUsername,
  session,
  onLogin,
  onLogout,
}: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setUsername(session.username);
      setPassword(session.role === "admin" ? session.adminPassword : "");
      setError(null);
      return;
    }

    setUsername("");
    setPassword("");
    setError(null);
  }, [session]);

  const trimmedUsername = username.trim();
  const isAdminUsername = trimmedUsername === adminUsername;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedUsername) {
      setError("Username is required.");
      return;
    }

    if (isAdminUsername) {
      if (!password.trim()) {
        setError("Admin password is required.");
        return;
      }

      setError(null);
      onLogin({
        role: "admin",
        username: trimmedUsername,
        adminPassword: password,
      });
      return;
    }

    setError(null);
    onLogin({
      role: "spectator",
      username: trimmedUsername,
    });
  };

  if (session) {
    return (
      <section className="login-shell">
        <div className="login-card panel">
          <p className="eyebrow">Signed in</p>
          <h1>AI Coding Agent Battle Royale</h1>
          <p className="login-card__lede">
            You are signed in as{" "}
            <strong>{session.role === "admin" ? "admin" : "spectator"}</strong>{" "}
            <span className="mono">{session.username}</span>.
          </p>
          <div className="session-summary">
            <div>
              <span className="label">Role</span>
              <strong>{session.role}</strong>
            </div>
            <div>
              <span className="label">Username</span>
              <strong>{session.username}</strong>
            </div>
          </div>
          <div className="button-row">
            <button type="button" className="button button--secondary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="login-shell">
      <div className="login-card panel">
        <p className="eyebrow">Welcome</p>
        <h1>AI Coding Agent Battle Royale</h1>
        <p className="login-card__lede">
          Enter a username to continue. If the username matches the admin account,
          the page will ask for the admin password.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              maxLength={40}
            />
          </label>

          {trimmedUsername && isAdminUsername ? (
            <label className="field">
              <span>Admin password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter the admin password"
                autoComplete="current-password"
              />
            </label>
          ) : null}

          {error ? <p className="field-error">{error}</p> : null}

          <button type="submit" className="button button--primary button--full">
            Login
          </button>
        </form>

        <p className="login-card__note">
          Admin username: <span className="mono">{adminUsername}</span>
        </p>
      </div>
    </section>
  );
}
