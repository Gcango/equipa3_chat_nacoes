import UserAvatar from "./UserAvatar";

const EVENTS = [
  { day: "22", mon: "SET", title: "Torneio de Futsal", meta: "22 Set · 16h00 · Pavilhão" },
  { day: "26", mon: "SET", title: "Feira de Cursos", meta: "26 Set · 10h00 · Átrio" },
  { day: "03", mon: "OUT", title: "Entrega de projectos", meta: "3 Out · 14h30 · Informática" },
];

const ONLINE = [
  "Ana Silva",
  "Miguel Costa",
  "Sofia Ribeiro",
  "Rafael Costa",
  "Délia Silva",
  "João Pedro",
  "Inês Martins",
  "Tomás Dias",
  "Carla Nunes",
  "Pedro Alves",
];

const QUICK = [
  { label: "Recursos da Escola", icon: "📚" },
  { label: "Calendário Escolar", icon: "📅" },
  { label: "Projetos em Grupo", icon: "👥" },
  { label: "Biblioteca Digital", icon: "📖" },
  { label: "Suporte / Ajuda", icon: "💬" },
];

export default function CommunityFeedWidgets() {
  return (
    <aside className="cn-side cn-side--widgets" aria-label="Eventos e atalhos">
      <section className="cn-widget cn-glass">
        <div className="cn-widget__head">
          <h3>Próximos eventos</h3>
          <span className="cn-widget__link">Ver todos</span>
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
        <h3>Pessoas online</h3>
        <p className="cn-widget__online-meta">12 pessoas online agora</p>
        <div className="cn-online-grid">
          {ONLINE.map((name) => (
            <div key={name} className="cn-online-grid__item">
              <span className="cn-online-grid__avatar">
                <UserAvatar name={name} size="sm" />
                <span className="cn-online-grid__dot" aria-hidden />
              </span>
              <span className="cn-online-grid__name">{name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cn-widget cn-glass">
        <h3>Acesso rápido</h3>
        <ul className="cn-quick">
          {QUICK.map((q) => (
            <li key={q.label}>
              <button type="button" disabled title="Em breve">
                <span aria-hidden>{q.icon}</span>
                {q.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="cn-brand-card cn-brand-card--photo cn-glass">
        <span className="cn-brand-card__icon" aria-hidden>
          🎓
        </span>
        <p className="cn-brand-card__title">GERABRIEL</p>
        <p className="cn-brand-card__sub">Escola Profissional · Comunidade Digital Escolar</p>
      </section>
    </aside>
  );
}
