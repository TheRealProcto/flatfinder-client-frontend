import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, isAuthenticated } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const validate = (): string | null => {
    if (firstName.trim().length < 2) return "O primeiro nome deve ter pelo menos 2 caracteres.";
    if (lastName.trim().length < 2) return "O último nome deve ter pelo menos 2 caracteres.";
    if (!birthDate) return "A data de nascimento é obrigatória.";
    if (!email.trim()) return "O email é obrigatório.";
    if (password.length < 6) return "A password deve ter pelo menos 6 caracteres.";
    if (password !== confirmPassword) return "As passwords não coincidem.";
    return null;
  };

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      !!birthDate &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      password === confirmPassword &&
      !isLoading
    );
  }, [firstName, lastName, birthDate, email, password, confirmPassword, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) return setError(validationError);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        email: email.trim(),
        password,
        confirmPassword,
      });

      navigate("/", { replace: true });
    } catch (err: any) {
      if (err?.response) {
        const status = err.response.status;
        const data = err.response.data;

        let message =
          typeof data === "string"
            ? data
            : data?.message || data?.error || data?.msg || JSON.stringify(data);

        if (typeof message === "string" && message.includes("<!DOCTYPE html>")) {
          const match = message.match(/Error:\s([^<]+)/);
          message = match?.[1]?.trim() || "Erro no servidor.";
        }

        return setError(`Erro ${status}: ${message}`);
      }

      setError(`Erro de rede: ${err?.message ?? "Sem detalhes"}`);
    }
  };

  return (
    <div className="auth-layout">
      <div className="card card--medium">
        <div>
          <h1 className="h1">Criar conta</h1>
          <p className="p mt-1">Preenche os teus dados para começares a usar o FlatFinder.</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="field">
              <label className="label" htmlFor="firstName">Primeiro nome</label>
              <input className="input" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>

            <div className="field">
              <label className="label" htmlFor="lastName">Último nome</label>
              <input className="input" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="birthDate">Data de nascimento</label>
            <input className="input" id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
          </div>

          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <div className="password-row">
              <input
                className="input"
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="btn btn--secondary" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="confirmPassword">Confirmar password</label>
            <div className="password-row">
              <input
                className="input"
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" className="btn btn--secondary" onClick={() => setShowConfirmPassword((v) => !v)}>
                {showConfirmPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          {error && <div className="alert alert--danger">{error}</div>}

          <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
            {isLoading ? "A registar..." : "Criar conta"}
          </button>

          <div className="footer-row">
            Já tens conta? <Link className="link-strong" to="/login">Fazer login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
