import UserAvatar from "./UserAvatar";

const STORIES = [
  { name: "Painel", label: "Painel Extra" },
  { name: "Sala Aula", label: "Sala de Aula" },
  { name: "Turma", label: "Turma 11º" },
  { name: "Projetos", label: "Projetos" },
  { name: "Eventos", label: "Eventos" },
  { name: "GERABRIEL", label: "Escola" },
];

type Props = { userName: string };

export default function CommunityStories({ userName }: Props) {
  return (
    <div className="cn-stories-row cn-glass" aria-label="Histórias e atalhos">
      <div className="cn-stories-row__scroll">
        <button type="button" className="cn-story-ring cn-story-ring--create" disabled title="Em breve">
          <span className="cn-story-ring__inner cn-story-ring__inner--add">+</span>
          <span className="cn-story-ring__label">Criar história</span>
        </button>
        <button type="button" className="cn-story-ring">
          <span className="cn-story-ring__gradient">
            <UserAvatar name={userName} size="md" />
          </span>
          <span className="cn-story-ring__label">{userName.split(" ")[0]}</span>
        </button>
        {STORIES.map((s) => (
          <button key={s.label} type="button" className="cn-story-ring" title="Em breve">
            <span className="cn-story-ring__gradient">
              <UserAvatar name={s.name} size="md" />
            </span>
            <span className="cn-story-ring__label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
