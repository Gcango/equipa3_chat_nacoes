import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoBrand from "../components/LogoBrand";
import PasswordInput from "../components/PasswordInput";
import { login } from "../api";

const SIDEBAR_FEATURES = [
  {
    title: "Conecta",
    text: "Com colegas, professores e a escola.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Partilha",
    text: "Projetos, notícias, eventos e muito mais.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Evolui",
    text: "Porque o teu sucesso é a nossa prioridade.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const;

/** Mensagens estilo rodapé — faixa diagonal do login */
const STUDY_TICKER = [
  "Formação profissional",
  "Horário escolar",
  "Notas e avaliações",
  "Projetos escolares",
  "Calendário de exames",
  "Biblioteca digital",
  "Comunidade educativa",
  "Workshops e oficinas",
  "Apoio ao estudo",
  "Eventos escolares",
  "Estágios · Erasmus",
  "Recursos pedagógicos",
] as const;

function StudyTickerRun({ labels }: { labels: readonly string[] }) {
  return (
    <span className="login-split__diagonal-ticker-run">
      {labels.map((label) => (
        <span key={label} className="login-split__diagonal-ticker-item">
          {label}
        </span>
      ))}
    </span>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/feed", { replace: true });
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await login(email.trim().toLowerCase(), password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-split">
      <div className="login-split__diagonal-ticker" aria-hidden>
        <div className="login-split__diagonal-ticker-skew">
          {[0, 1, 2].map((lane) => (
            <div key={lane} className="login-split__diagonal-ticker-lane">
              <div className="login-split__diagonal-ticker-track">
                <StudyTickerRun labels={STUDY_TICKER} />
                <StudyTickerRun labels={STUDY_TICKER} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="login-split__brand" aria-label="Escola Profissional GERABRIEL">
        <div className="login-split__brand-rings" aria-hidden />
        <div className="login-split__brand-inner">
          <div className="login-split__logo">
            <LogoBrand variant="topbar" loginPanel />
          </div>

          <h1 className="login-split__headline">
            Juntos construímos o teu <span className="login-split__accent">futuro</span>
          </h1>
          <p className="login-split__intro">
            A Comunidade Gerabriel é o espaço digital onde alunos, professores e toda a
            comunidade escolar se ligam, partilham e evoluem.
          </p>

          <ul className="login-split__features">
            {SIDEBAR_FEATURES.map((item) => (
              <li key={item.title} className="login-split__feature">
                <span className="login-split__feature-icon">{item.icon}</span>
                <span className="login-split__feature-copy">
                  <strong>{item.title}</strong>
                  <span className="login-split__feature-text">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="login-split__brand-footer">GERABRIEL • MAIS QUE UMA ESCOLA</p>
        </div>
      </aside>

      <main className="login-split__main">
        <div className="login-split__main-rings" aria-hidden />

        <header className="login-split__secure">
          <span className="login-split__secure-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2l8 3.5v5.5c0 4.2-2.8 8.1-8 9.5-5.2-1.4-8-5.3-8-9.5V5.5L12 2z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="login-split__secure-text">
            <span className="login-split__secure-title">
              Acesso seguro
              <span className="login-split__secure-dot" aria-hidden />
            </span>
            <span className="login-split__secure-sub">Comunidade Digital Escolar</span>
          </span>
        </header>

        <div className="login-split__body">
          <div className="login-split__content">
            <div className="login-split__intro-block">
              <p className="login-split__eyebrow">
                <span className="login-split__eyebrow-school">ESCOLA</span> GERABRIEL
              </p>
              <span className="login-split__eyebrow-line" aria-hidden />
            </div>
            <h2 className="login-split__welcome">
              Bem-vindo à Comunidade{" "}
              <span className="login-split__welcome-brand">Gerabriel</span>
            </h2>
            <p className="login-split__subtitle">
              Inicie sessão com as suas credenciais da escola e aceda a todos os recursos da
              comunidade.
            </p>

            <section className="login-split__auth" aria-label="Iniciar sessão">
              <form onSubmit={onSubmit} className="login-split__form">
                <label className="login-split__label">
                  E-mail escolar
                  <div className="login-field">
                    <span className="login-field__icon" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 6h16v12H4V6z"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 7l8 6 8-6"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <input
                      type="email"
                      placeholder="nome@gerabriel.edu.pt"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                      spellCheck={false}
                    />
                  </div>
                </label>

                <label className="login-split__label">
                  Palavra-passe
                  <PasswordInput
                    variant="login"
                    value={password}
                    onChange={setPassword}
                    placeholder="Introduza a sua palavra-passe"
                    required
                    autoComplete="current-password"
                  />
                </label>

                {error && <p className="login-split__error">{error}</p>}

                <button type="submit" className="login-split__submit" disabled={loading}>
                  {loading ? (
                    "A iniciar…"
                  ) : (
                    <>
                      <span className="login-split__submit-arrow" aria-hidden>
                        →
                      </span>
                      Entrar
                    </>
                  )}
                </button>
              </form>
              <Link to="/login/palavra-passe" className="login-split__forgot">
                Esqueci-me da palavra-passe
              </Link>
            </section>
          </div>
        </div>

        <footer className="login-split__main-footer">
          <p className="login-split__note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
              <path d="M12 10v6M12 8h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            As suas credenciais são atribuídas pela escola.
          </p>
        </footer>
      </main>
    </div>
  );
}
