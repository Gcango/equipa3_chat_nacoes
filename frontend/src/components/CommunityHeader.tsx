import { Link } from "react-router-dom";
import type { CommunitySummary, User } from "../api";
import { useCommunityNav } from "../context/CommunityNavContext";
import { IcBell } from "./CommunityIcons";
import LogoBrand from "./LogoBrand";
import UserAvatar from "./UserAvatar";

const ROLE_LABEL: Record<string, string> = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  ADMIN: "Administrador",
};

type Props = {
  user: User | null;
  onLogout?: () => void;
  summary?: CommunitySummary;
};

function roleLine(user: User) {
  const role = ROLE_LABEL[user.role] ?? user.role;
  return user.classGroup && user.classGroup !== "—"
    ? `${role} · ${user.classGroup}`
    : role;
}

export default function CommunityHeader({ user, onLogout, summary }: Props) {
  const unreadNotif = summary?.unreadNotifications ?? 0;
  const nav = useCommunityNav();

  return (
    <header className="cn-header">
      <div className="cn-header__inner cn-header__inner--mockup">
        <div className="cn-header__lead">
          {nav && (
            <button
              type="button"
              className={`cn-header__menu${nav.navOpen ? " cn-header__menu--active" : ""}`}
              aria-label={nav.navOpen ? "Fechar definições" : "Abrir definições e conta"}
              aria-expanded={nav.navOpen}
              aria-controls="cn-nav-drawer"
              onClick={nav.toggleNav}
            >
              <span className="cn-header__menu-bars" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>
          )}
          <Link to="/feed" className="cn-header__brand">
            <LogoBrand variant="topbar" loginPanel />
          </Link>
        </div>

        <div className="cn-header__actions">
          <Link
            to="/notificacoes"
            className="cn-header__icon cn-header__icon--badge"
            aria-label="Notificações"
          >
            <IcBell />
            {unreadNotif > 0 && <span className="cn-header__badge">{unreadNotif}</span>}
          </Link>

          {user ? (
            <div className="cn-header__user">
              <Link
                to="/perfil"
                className="cn-header__profile-avatar"
                aria-label={`Perfil de ${user.name}`}
              >
                <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
              </Link>
              <div className="cn-header__profile-text">
                <Link to="/perfil" className="cn-header__profile-name">
                  {user.name}
                </Link>
                <span>{roleLine(user)}</span>
              </div>
            </div>
          ) : (
            <Link to="/login" className="cn-header__login-link">
              Iniciar sessão
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
