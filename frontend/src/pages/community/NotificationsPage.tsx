import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CommunityLayout from "../../components/CommunityLayout";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function NotificationsPage() {
  const { user, displayUser, error, logout, summary, refreshSummary } = useAuthUser();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [localError, setLocalError] = useState("");

  async function load() {
    setItems(await fetchNotifications());
    await refreshSummary();
  }

  useEffect(() => {
    load().catch((e) => setLocalError(e instanceof Error ? e.message : "Erro."));
  }, []);

  async function onRead(id: string) {
    await markNotificationRead(id);
    await load();
  }

  async function onReadAll() {
    await markAllNotificationsRead();
    await load();
  }

  return (
    <CommunityLayout
      user={user}
      displayUser={displayUser}
      onLogout={logout}
      summary={summary}
      error={error || localError}
      showWidgets={false}
    >
      <section className="cn-page cn-glass">
        <div className="cn-page__head">
          <h2 className="cn-page__title">Notificações</h2>
          <button type="button" className="cn-btn cn-btn--ghost" onClick={() => void onReadAll()}>
            Marcar todas como lidas
          </button>
        </div>
        <ul className="cn-notif-list">
          {items.map((n) => (
            <li key={n.id} className={n.readAt ? "cn-notif-list__read" : ""}>
              <div>
                <strong>{n.title}</strong>
                <p>{n.body}</p>
                <span className="cn-notif-list__time">
                  {new Date(n.createdAt).toLocaleString("pt-PT")}
                </span>
              </div>
              <div className="cn-notif-list__actions">
                {n.href && (
                  <Link to={n.href} className="cn-btn cn-btn--ghost" onClick={() => void onRead(n.id)}>
                    Abrir
                  </Link>
                )}
                {!n.readAt && (
                  <button type="button" className="cn-btn cn-btn--primary" onClick={() => void onRead(n.id)}>
                    Lida
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </CommunityLayout>
  );
}
