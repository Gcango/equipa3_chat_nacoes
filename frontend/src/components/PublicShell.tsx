import { Link } from "react-router-dom";
import LogoBrand from "./LogoBrand";

type Props = {
  children: React.ReactNode;
};

/** Layout público (login/registo) — estilo portal escolar */
export default function PublicShell({ children }: Props) {
  return (
    <div className="public-shell">
      <div className="site-header-block">
      <header className="site-top">
        <div className="site-top__inner">
          <Link to="/login" className="site-top__brand">
            <LogoBrand variant="topbar" compact />
          </Link>
          <div className="site-top__actions">
            <span className="site-top__access-note">Acesso reservado à comunidade escolar</span>
          </div>
        </div>
      </header>
      <nav className="site-main-nav site-main-nav--public" aria-label="Secções">
        <div className="site-main-nav__inner">
          <span className="site-main-nav__item site-main-nav__item--active">Iniciar sessão</span>
          <span className="site-main-nav__item site-main-nav__item--muted">Rede privada @epgerabriel.edu.pt</span>
        </div>
      </nav>
      </div>
      {children}
      <footer className="site-footer site-footer--public">
        <p>GERABRIEL Escola Profissional · Comunicação segura e moderada</p>
      </footer>
    </div>
  );
}
