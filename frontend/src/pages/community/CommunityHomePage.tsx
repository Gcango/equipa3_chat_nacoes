import { Link } from "react-router-dom";
import CommunityLayout from "../../components/CommunityLayout";
import CommunityWelcomeBanner from "../../components/CommunityWelcomeBanner";
import { useAuthUser } from "../../hooks/useAuthUser";

const LINKS = [
  { to: "/feed", label: "Início", desc: "Feed, notícias e publicações" },
  { to: "/mensagens", label: "Mensagens", desc: "Conversas privadas" },
  { to: "/grupos", label: "Grupos", desc: "Turmas, comunidades e projectos" },
  { to: "/calendario", label: "Calendário", desc: "Eventos e agenda escolar" },
  { to: "/escola", label: "A escola", desc: "Identidade, contactos e recursos" },
];

export default function CommunityHomePage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const firstName = displayUser?.name.split(" ")[0] ?? "Aluno";

  return (
    <CommunityLayout
      user={user}
      displayUser={displayUser}
      onLogout={logout}
      summary={summary}
      error={error}
    >
      <CommunityWelcomeBanner />
      <section className="cn-page cn-glass">
        <h2 className="cn-page__title">Olá, {firstName}</h2>
        <p className="cn-page__lead">Escolhe uma área da comunidade escolar.</p>
        <ul className="cn-page__tiles">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="cn-page__tile">
                <strong>{l.label}</strong>
                <span>{l.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </CommunityLayout>
  );
}
