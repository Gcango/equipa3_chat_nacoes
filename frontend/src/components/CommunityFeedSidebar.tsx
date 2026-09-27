import { Link, useLocation } from "react-router-dom";
import type { CommunitySummary, User } from "../api";
import { IcBell, IcFolder, IcMessages, IcSettings } from "./CommunityIcons";

type Props = {
  user: User;
  summary: CommunitySummary;
  onNavigate?: () => void;
  onLogout?: () => void;
  drawer?: boolean;
  className?: string;
};

type DrawerLink = {
  to: string;
  label: string;
  icon: typeof IcMessages;
  badgeKey?: "messages" | "notifications";
};

const DRAWER_COMMS: DrawerLink[] = [
  { to: "/mensagens", label: "Mensagens", icon: IcMessages, badgeKey: "messages" },
  { to: "/notificacoes", label: "Notificações", icon: IcBell, badgeKey: "notifications" },
];

const DRAWER_ACCOUNT: DrawerLink[] = [
  { to: "/perfil", label: "Definições de perfil", icon: IcSettings },
  { to: "/escola#recursos", label: "A escola e recursos", icon: IcFolder },
];

function navActive(pathname: string, to: string) {
  const base = to.split("#")[0];
  return pathname === base || pathname.startsWith(`${base}/`);
}

function DrawerLinks({
  items,
  pathname,
  onNavigate,
  badgeCount,
}: {
  items: DrawerLink[];
  pathname: string;
  onNavigate?: () => void;
  badgeCount: (key?: "messages" | "notifications") => number;
}) {
  return (
    <>
      {items.map(({ to, label, icon: Icon, badgeKey }) => {
        const active = navActive(pathname, to);
        const count = badgeCount(badgeKey);
        return (
          <Link
            key={to}
            to={to}
            className={`cn-drawer-link${active ? " cn-drawer-link--active" : ""}`}
            onClick={onNavigate}
          >
            <Icon className="cn-drawer-link__icon" />
            <span className="cn-drawer-link__label">{label}</span>
            {count > 0 && <span className="cn-drawer-link__badge">{count}</span>}
          </Link>
        );
      })}
    </>
  );
}

export default function CommunityFeedSidebar({
  user,
  summary,
  onNavigate,
  onLogout,
  drawer = false,
  className,
}: Props) {
  const { pathname } = useLocation();
  const isAdmin = user.role === "ADMIN";

  function badgeCount(key?: "messages" | "notifications") {
    if (key === "messages") return summary.unreadMessages;
    if (key === "notifications") return summary.unreadNotifications;
    return 0;
  }

  if (!drawer) {
    return null;
  }

  return (
    <aside
      className={["cn-side", "cn-side--left", "cn-side--drawer", className].filter(Boolean).join(" ")}
      aria-label="Definições e conta"
    >
      <section className="cn-drawer-section">
        <h3 className="cn-drawer-section__title">Comunicação</h3>
        <nav className="cn-drawer-section__nav" aria-label="Comunicação">
          <DrawerLinks
            items={DRAWER_COMMS}
            pathname={pathname}
            onNavigate={onNavigate}
            badgeCount={badgeCount}
          />
        </nav>
      </section>

      <section className="cn-drawer-section">
        <h3 className="cn-drawer-section__title">Conta</h3>
        <nav className="cn-drawer-section__nav" aria-label="Conta e preferências">
          <DrawerLinks
            items={DRAWER_ACCOUNT}
            pathname={pathname}
            onNavigate={onNavigate}
            badgeCount={badgeCount}
          />
        </nav>
      </section>

      {isAdmin && (
        <section className="cn-drawer-section">
          <h3 className="cn-drawer-section__title">Escola</h3>
          <nav className="cn-drawer-section__nav" aria-label="Moderação">
            <Link
              to="/admin"
              className={`cn-drawer-link${pathname === "/admin" ? " cn-drawer-link--active" : ""}`}
              onClick={onNavigate}
            >
              <IcSettings className="cn-drawer-link__icon" />
              <span className="cn-drawer-link__label">Direção e administração</span>
            </Link>
          </nav>
        </section>
      )}

      <section className="cn-drawer-section cn-drawer-section--hint">
        <h3 className="cn-drawer-section__title">Sessão</h3>
        <p className="cn-drawer-hint">
          Perfil e foto: toca no teu nome ou avatar no canto superior direito do cabeçalho.
        </p>
        {onLogout && (
          <button type="button" className="cn-drawer-logout" onClick={onLogout}>
            Terminar sessão
          </button>
        )}
      </section>
    </aside>
  );
}
