import { Link, useLocation } from "react-router-dom";
import type { User } from "../api";
import CofinanciamentoBanner from "./CofinanciamentoBanner";
import LogoBrand from "./LogoBrand";
import UserAvatar from "./UserAvatar";

const ROLE_LABEL: Record<string, string> = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  ADMIN: "Administrador",
};

type Props = {
  user: User | null;
  children: React.ReactNode;
  onLogout?: () => void;
  hero?: { title: string; subtitle?: string };
};

export default function AppShell({ user, children, onLogout, hero }: Props) {
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <div className="site-header-block">
      <header className="site-top">
        <div className="site-top__inner">
          <Link to="/" className="site-top__brand">
            <LogoBrand variant="topbar" compact />
          </Link>
          {user && (
            <div className="site-top__actions">
              <div className="site-top__user">
                <UserAvatar name={user.name} size="md" />
                <span className="site-top__user-label">
                  {user.name.split(" ")[0]} · {ROLE_LABEL[user.role] ?? user.role}
                </span>
              </div>
              <button type="button" className="btn btn--outline" onClick={onLogout}>
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="site-main-nav" aria-label="Menu principal">
        <div className="site-main-nav__inner">
          <Link
            to="/"
            className={`site-main-nav__item${pathname === "/" ? " site-main-nav__item--active" : ""}`}
          >
            Início
          </Link>
          <Link
            to="/perfil"
            className={`site-main-nav__item${pathname === "/perfil" ? " site-main-nav__item--active" : ""}`}
          >
            Perfil
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className={`site-main-nav__item${pathname === "/admin" ? " site-main-nav__item--active" : ""}`}
            >
              Moderação
            </Link>
          )}
          <span className="site-main-nav__spacer" />
          <span className="site-main-nav__item site-main-nav__item--muted">@epgerabriel.edu.pt</span>
        </div>
      </nav>
      </div>

      {hero && (
        <section className="hero hero--compact" aria-label="Destaque">
          <div className="hero__overlay" />
          <div className="hero__content hero__content--wide">
            <h1 className="hero__title">{hero.title}</h1>
            <span className="hero__accent" aria-hidden />
            {hero.subtitle && <p className="hero__subtitle">{hero.subtitle}</p>}
          </div>
        </section>
      )}

      <div className="site-body">{children}</div>
      <footer className="site-footer">
        <p>GERABRIEL Escola Profissional · Rede privada · Ambiente moderado</p>
        <p className="site-footer__sub">Comunicação respeitosa entre alunos, professores e escola</p>
        <CofinanciamentoBanner className="cofin-banner--in-footer" />
      </footer>
    </div>
  );
}
