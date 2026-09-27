import { Link } from "react-router-dom";
import FooterPartners from "./FooterPartners";
import LogoBrand from "./LogoBrand";

const COMUNIDADE_LINKS = [
  { to: "/feed", label: "Início" },
  { to: "/grupos#projectos", label: "Projetos" },
  { to: "/grupos", label: "Grupos" },
  { to: "/mensagens", label: "Pessoas" },
];

const ESCOLA_LINKS = [
  { to: "/feed", label: "Notícias" },
  { to: "/calendario", label: "Eventos" },
  { to: "/calendario", label: "Calendário" },
  { to: "/escola", label: "Regulamento" },
];

const AJUDA_LINKS = [
  { to: "/escola#recursos", label: "FAQ" },
  { to: "/escola#recursos", label: "Suporte" },
  { to: "/escola", label: "Contacto" },
];

export default function CommunityFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="cn-footer" aria-label="Rodapé da comunidade">
      <div className="cn-footer__inner">
        <div className="cn-footer__grid">
          <div className="cn-footer__brand">
            <Link to="/feed" className="cn-footer__logo">
              <LogoBrand variant="topbar" loginPanel />
            </Link>
            <p className="cn-footer__tagline">Juntos construímos o teu futuro.</p>
          </div>

          <nav className="cn-footer__col" aria-label="Comunidade">
            <h3 className="cn-footer__col-title">Comunidade</h3>
            <ul className="cn-footer__links">
              {COMUNIDADE_LINKS.map(({ to, label }) => (
                <li key={label}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="cn-footer__col" aria-label="Escola">
            <h3 className="cn-footer__col-title">Escola</h3>
            <ul className="cn-footer__links">
              {ESCOLA_LINKS.map(({ to, label }) => (
                <li key={label}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="cn-footer__col" aria-label="Ajuda">
            <h3 className="cn-footer__col-title">Ajuda</h3>
            <ul className="cn-footer__links">
              {AJUDA_LINKS.map(({ to, label }) => (
                <li key={label}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <FooterPartners />

        <div className="cn-footer__bottom">
          <div className="cn-footer__legal">
            <span>© {year} Escola Profissional Gerabriel</span>
            <Link to="/escola" className="cn-footer__legal-link">
              Privacidade
            </Link>
            <Link to="/escola" className="cn-footer__legal-link">
              Termos
            </Link>
          </div>
          <p className="cn-footer__product">Comunidade Digital Escolar</p>
          <div className="cn-footer__dots" aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </footer>
  );
}
