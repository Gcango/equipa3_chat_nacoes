import { useEffect, useState } from "react";
import CommunityLayout from "../../components/CommunityLayout";
import { fetchSchoolEvents, type SchoolEvent } from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

function formatEventDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, "0"),
    mon: d.toLocaleString("pt-PT", { month: "short" }).replace(".", "").toUpperCase(),
    full: d.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }),
  };
}

export default function CalendarPage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    fetchSchoolEvents()
      .then(setEvents)
      .catch((e) => setLocalError(e instanceof Error ? e.message : "Erro."));
  }, []);

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
        <h2 className="cn-page__title">Calendário escolar</h2>
        <ul className="cn-events cn-events--page">
          {events.map((e) => {
            const dt = formatEventDate(e.startsAt);
            return (
              <li key={e.id}>
                <div className="cn-events__date">
                  <span>{dt.day}</span>
                  <small>{dt.mon}</small>
                </div>
                <div>
                  <strong>{e.title}</strong>
                  <span>
                    {dt.full}
                    {e.location ? ` · ${e.location}` : ""}
                  </span>
                  {e.description && <p className="cn-page__muted">{e.description}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </CommunityLayout>
  );
}
