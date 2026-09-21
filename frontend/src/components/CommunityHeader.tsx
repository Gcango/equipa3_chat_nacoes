import { Link, useLocation } from "react-router-dom";
import type { CommunitySummary, User } from "../api";
import { IcBell, IcHome, IcMessages, IcUsers } from "./CommunityIcons";
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
  return user.classGroup ? `${role} - ${user.classGroup}` : role;
}

export default function CommunityHeader({ user, onLogout, summary }: Props) {
  const { pathname } = useLocation();
  const unreadMsg = summary?.unreadMessages ?? 0;
  const unreadNotif = summary?.unreadNotifications ?? 0;

  return (
    <header className="cn-header">
      <div className="cn-header__inner">
        <Link to="/feed" className="cn-header__brand">
          <LogoBrand variant="topbar" compact />
        </Link>

        <div className="cn-header__actions">
          <Link
            to="/feed"
            className={`cn-header__icon${pathname === "/feed" ? " cn-header__icon--active" : ""}`}
            aria-label="Início"
          >
            <IcHome />
          </Link>
          <Link
            to="/grupos"
            className={`cn-header__icon${pathname.startsWith("/grupos") ? " cn-header__icon--active" : ""}`}
            aria-label="Grupos"
          >
            <IcUsers />
          </Link>
          <Link
            to="/mensagens"
            className={`cn-header__icon cn-header__icon--badge${pathname.startsWith("/mensagens") ? " cn-header__icon--active" : ""}`}
            aria-label="Mensagens"
          >
            <IcMessages />
            {unreadMsg > 0 && <span className="cn-header__badge">{unreadMsg}</span>}
          </Link>
          <Link
            to="/notificacoes"
            className={`cn-header__icon cn-header__icon--badge${pathname.startsWith("/notificacoes") ? " cn-header__icon--active" : ""}`}
            aria-label="Notificações"
          >
            <IcBell />
            {unreadNotif > 0 && <span className="cn-header__badge">{unreadNotif}</span>}
          </Link>

          {user ? (
            <>
              <Link to="/perfil" className="cn-header__profile">
                <UserAvatar name={user.name} size="md" />
                <div className="cn-header__profile-text">
                  <strong>{user.name}</strong>
                  <span>{roleLine(user)}</span>
                </div>
              </Link>
              {onLogout && (
                <button type="button" className="cn-header__logout" onClick={onLogout}>
                  Sair
                </button>
              )}
            </>
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
