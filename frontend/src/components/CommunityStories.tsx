const STORIES = [
  { label: "Turma 11ºA", tone: "linear-gradient(160deg, #1e3a5f, #0ea5e9)" },
  { label: "Eventos", tone: "linear-gradient(160deg, #4a1942, #f58220)" },
  { label: "Projetos", tone: "linear-gradient(160deg, #134e4a, #22c55e)" },
  { label: "Desporto", tone: "linear-gradient(160deg, #1e293b, #6366f1)" },
  { label: "Momentos", tone: "linear-gradient(160deg, #422006, #eab308)" },
];

type Props = { userName: string };

export default function CommunityStories({ userName }: Props) {
  const first = userName.split(" ")[0] ?? "Tu";

  return (
    <div className="cn-stories cn-glass" aria-label="Histórias e atalhos">
      <div className="cn-stories__scroll">
        <button
          type="button"
          className="cn-stories__card cn-stories__card--create"
          disabled
          title="Em breve"
        >
          <span className="cn-stories__plus">+</span>
          <span className="cn-stories__label">Criar história</span>
        </button>
        {STORIES.map((s) => (
          <button
            key={s.label}
            type="button"
            className="cn-stories__card"
            style={{ background: s.tone }}
            title="Em breve"
          >
            <span className="cn-stories__label">{s.label}</span>
          </button>
        ))}
        <button
          type="button"
          className="cn-stories__card"
          style={{ background: "linear-gradient(160deg, #0a1f44, #0073cf)" }}
          title="Em breve"
        >
          <span className="cn-stories__label">{first}</span>
        </button>
      </div>
    </div>
  );
}
