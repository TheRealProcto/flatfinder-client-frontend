import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !isLoading,
    [email, password, isLoading]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      const message =
        typeof data === "string"
          ? data
          : data?.message || data?.error || data?.msg || err?.message || "Não foi possível iniciar sessão.";

      setError(status ? `Erro ${status}: ${message}` : message);
    }
  };

  return (
    <div className="auth-layout">
      <div className="card card--narrow">
        <div>
          <h1 className="h1">Entrar</h1>
          <p className="p mt-1">Bem-vindo(a) de volta. Entra com as tuas credenciais.</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: vitor@email.com"
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">Password</label>

            <div className="password-row">
              <input
                className="input"
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="A tua password"
                required
              />

              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          {error && <div className="alert alert--danger">{error}</div>}

          <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
            {isLoading ? "A entrar..." : "Entrar"}
          </button>

          <div className="footer-row">
            Ainda não tens conta?{" "}
            <Link className="link-strong" to="/register">Criar conta</Link>
          </div>

        </form>
      </div>
    </div>
  );
}
