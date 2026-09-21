import { Link, useLocation } from "react-router-dom";
import type { CommunityGroup, CommunitySummary, User } from "../api";
import {
  IcBell,
  IcCalendar,
  IcFeed,
  IcFolder,
  IcGroups,
  IcHome,
  IcMessages,
  IcSettings,
} from "./CommunityIcons";
import { useEffect, useState } from "react";
import { fetchCommunityGroups, joinCommunityGroup, leaveCommunityGroup } from "../api";

type Props = {
  user: User;
  summary: CommunitySummary;
};

const NAV = [
  { to: "/feed", label: "Início", icon: IcHome, end: true },
  { to: "/feed", label: "Feed", icon: IcFeed, end: true },
  { to: "/mensagens", label: "Mensagens", icon: IcMessages, badgeKey: "messages" as const },
  { to: "/notificacoes", label: "Notificações", icon: IcBell, badgeKey: "notifications" as const },
  { to: "/grupos", label: "Grupos", icon: IcGroups },
  { to: "/calendario", label: "Calendário", icon: IcCalendar },
  { to: "/projetos", label: "Projetos", icon: IcFolder },
  { to: "/recursos", label: "Recursos", icon: IcFolder },
  { to: "/escola", label: "Identidade da Escola", icon: IcGroups },
  { to: "/perfil", label: "Definições", icon: IcSettings },
];

function navActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function CommunityFeedSidebar({ user, summary }: Props) {
  const { pathname } = useLocation();
  const isAdmin = user.role === "ADMIN";
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [groupBusy, setGroupBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunityGroups()
      .then(setGroups)
      .catch(() => setGroups([]));
  }, [pathname]);

  const myGroups = groups.filter((g) => g.isMember);

  async function toggleGroup(g: CommunityGroup) {
    setGroupBusy(g.id);
    try {
      if (g.isMember) await leaveCommunityGroup(g.id);
      else await joinCommunityGroup(g.id);
      const next = await fetchCommunityGroups();
      setGroups(next);
    } finally {
      setGroupBusy(null);
    }
  }

  function badgeCount(key?: "messages" | "notifications") {
    if (key === "messages") return summary.unreadMessages;
    if (key === "notifications") return summary.unreadNotifications;
    return 0;
  }

  return (
    <aside className="cn-side cn-side--left" aria-label="Menu da comunidade">
      <nav className="cn-nav cn-glass">
        {NAV.map(({ to, label, icon: Icon, end, badgeKey }) => {
          const active = navActive(pathname, to, end);
          const count = badgeCount(badgeKey);
          return (
            <Link
              key={to}
              to={to}
              className={`cn-nav__item${active ? " cn-nav__item--active" : ""}`}
            >
              <Icon className="cn-nav__icon" />
              <span>{label}</span>
              {count > 0 && <span className="cn-nav__badge">{count}</span>}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin"
            className={`cn-nav__item${pathname === "/admin" ? " cn-nav__item--active" : ""}`}
          >
            <IcSettings className="cn-nav__icon" />
            <span>Moderação</span>
          </Link>
        )}
      </nav>

      <div className="cn-groups cn-glass">
        <div className="cn-groups__head">
          <h3>Os teus grupos</h3>
          <Link to="/grupos" className="cn-groups__add" title="Gerir grupos">
            +
          </Link>
        </div>
        <ul className="cn-groups__list">
          {myGroups.length === 0 && (
            <li className="cn-groups__empty">
              <Link to="/grupos">Explora grupos da escola</Link>
            </li>
          )}
          {myGroups.map((g) => (
            <li key={g.id}>
              <span className="cn-groups__icon" aria-hidden />
              <div>
                <span className="cn-groups__name">{g.name}</span>
                <span className="cn-groups__count">{g.memberCount} membros</span>
              </div>
            </li>
          ))}
        </ul>
        {groups.some((g) => !g.isMember) && (
          <ul className="cn-groups__list cn-groups__list--suggest">
            {groups
              .filter((g) => !g.isMember)
              .slice(0, 2)
              .map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className="cn-groups__join"
                    disabled={groupBusy === g.id}
                    onClick={() => void toggleGroup(g)}
                  >
                    + {g.name}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="cn-safe cn-glass">
        <span className="cn-safe__icon" aria-hidden>
          🛡️
        </span>
        <div>
          <strong>Ambiente seguro</strong>
          <p>Apenas membros da escola participam. Conteúdo moderado pela equipa GERABRIEL.</p>
        </div>
      </div>
    </aside>
  );
}
