import type { CommunitySummary, User } from "../api";
import CommunityFeedSidebar from "./CommunityFeedSidebar";

type Props = {
  open: boolean;
  user: User;
  summary: CommunitySummary;
  onClose: () => void;
  onLogout: () => void;
};

export default function CommunitySettingsDrawer({
  open,
  user,
  summary,
  onClose,
  onLogout,
}: Props) {
  return (
    <div
      id="cn-nav-drawer"
      className={`cn-nav-drawer${open ? " cn-nav-drawer--open" : ""}`}
      aria-hidden={!open}
    >
      <div className="cn-nav-drawer__panel" role="dialog" aria-modal="true" aria-label="Definições e conta">
        <header className="cn-nav-drawer__head">
          <div>
            <p className="cn-nav-drawer__kicker">Conta</p>
            <h2 className="cn-nav-drawer__title">Definições</h2>
          </div>
          <button type="button" className="cn-nav-drawer__close" aria-label="Fechar definições" onClick={onClose}>
            <span aria-hidden>×</span>
          </button>
        </header>
        <CommunityFeedSidebar
          drawer
          user={user}
          summary={summary}
          onNavigate={onClose}
          onLogout={() => {
            onClose();
            onLogout();
          }}
        />
      </div>
    </div>
  );
}
