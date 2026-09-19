import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoBrand from "../components/LogoBrand";
import PasswordInput from "../components/PasswordInput";
import { login } from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/", { replace: true });
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await login(email.trim().toLowerCase(), password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-gate">
      <div className="login-gate__inner">
        <div className="login-gate__brand">
          <LogoBrand variant="topbar" compact />
        </div>
        <div className="auth-card auth-card--elevated login-gate__card">
          <h1 className="auth-card__heading">Login</h1>
          <p className="auth-card__lead">Credenciais atribuídas pela escola (@epgerabriel.edu.pt)</p>
          <form onSubmit={onSubmit} className="form">
            <label>
              E-mail escolar
              <input
                type="email"
                placeholder="nome@epgerabriel.edu.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Palavra-passe
              <PasswordInput
                value={password}
                onChange={setPassword}
                required
                autoComplete="current-password"
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
              {loading ? "A iniciar…" : "Login"}
            </button>
          </form>
          <p className="auth-card__footer auth-card__footer--info">
            <span className="auth-card__obs">OBS.</span> Sem credenciais? Contacta a secretaria — a
            escola cria as contas dos alunos.{" "}
            <Link to="/login/palavra-passe" className="auth-card__inline-link">
              Esqueceste-te da palavra-passe?
            </Link>
          </p>
        </div>
        <p className="login-gate__legal">Acesso reservado · Comunidade Digital Escolar</p>
      </div>
    </div>
  );
}
