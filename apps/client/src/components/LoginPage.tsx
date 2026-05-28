import { useEffect, useState, type FormEvent } from "react";

import type { Session } from "../types/game";

type LoginPageProps = {
  adminUsername: string;
  onLogin: (session: Session) => void;
};

export function LoginPage({ adminUsername, onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [username]);

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

      onLogin({
        role: "admin",
        username: trimmedUsername,
        adminPassword: password,
      });
      return;
    }

    onLogin({
      role: "spectator",
      username: trimmedUsername,
    });
  };

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
