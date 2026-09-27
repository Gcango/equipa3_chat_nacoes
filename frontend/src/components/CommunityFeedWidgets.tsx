import { Link } from "react-router-dom";
import UserAvatar from "./UserAvatar";

const NEWS = [
  {
    title: "Torneio de Futsal",
    date: "22 Set",
    thumb: "linear-gradient(135deg, #1e40af, #3b82f6)",
  },
  {
    title: "Feira de Cursos",
    date: "26 Set",
    thumb: "linear-gradient(135deg, #c2410c, #f97316)",
  },
  {
    title: "Entrega de projectos",
    date: "3 Out",
    thumb: "linear-gradient(135deg, #065f46, #10b981)",
  },
];

const EVENTS = [
  { day: "30", mon: "SET", title: "Palestra: O futuro do teu curso", meta: "30 Set · 10h00 · Auditório" },
  { day: "22", mon: "SET", title: "Torneio de Futsal", meta: "22 Set · 16h00 · Pavilhão" },
  { day: "03", mon: "OUT", title: "Entrega de projectos", meta: "3 Out · 14h30 · Informática" },
];

const SUGGEST = [
  { name: "Ana Silva", role: "Aluna · 11ºB" },
  { name: "Miguel Costa", role: "Aluno · 12ºA" },
  { name: "Sofia Ribeiro", role: "Professora" },
];

export default function CommunityFeedWidgets() {
  return (
    <aside className="cn-side cn-side--widgets" aria-label="Notícias, eventos e sugestões">
      <section className="cn-widget cn-glass">
        <div className="cn-widget__head">
          <h3>Últimas notícias</h3>
          <Link to="/feed" className="cn-widget__link">
            Ver todas
          </Link>
        </div>
        <ul className="cn-news">
          {NEWS.map((n) => (
            <li key={n.title}>
              <span className="cn-news__thumb" style={{ background: n.thumb }} aria-hidden />
              <div>
                <strong>{n.title}</strong>
                <span>{n.date}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="cn-widget cn-glass">
        <div className="cn-widget__head">
          <h3>Próximos eventos</h3>
          <Link to="/calendario" className="cn-widget__link">
            Ver todos
          </Link>
        </div>
        <ul className="cn-events">
          {EVENTS.map((e) => (
            <li key={e.title}>
              <div className="cn-events__date">
                <span>{e.day}</span>
                <small>{e.mon}</small>
              </div>
              <div>
                <strong>{e.title}</strong>
                <span>{e.meta}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="cn-widget cn-glass">
        <h3>Pessoas que talvez conheças</h3>
        <ul className="cn-suggest">
          {SUGGEST.map((p) => (
            <li key={p.name}>
              <UserAvatar name={p.name} size="sm" />
              <div className="cn-suggest__meta">
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </div>
              <button type="button" className="cn-suggest__follow" disabled title="Em breve">
                + Seguir
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
