import { useEffect, useState } from "react";
import CommunityLayout from "../../components/CommunityLayout";
import { fetchCommunityGroups, joinCommunityGroup, leaveCommunityGroup, type CommunityGroup } from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function GroupsPage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  async function load() {
    setGroups(await fetchCommunityGroups());
  }

  useEffect(() => {
    load().catch((e) => setLocalError(e instanceof Error ? e.message : "Erro."));
  }, []);

  async function toggle(g: CommunityGroup) {
    setBusy(g.id);
    try {
      if (g.isMember) await leaveCommunityGroup(g.id);
      else await joinCommunityGroup(g.id);
      await load();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setBusy(null);
    }
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
        <h2 className="cn-page__title">Grupos</h2>
        <p className="cn-page__lead">Junta-te às turmas e comunidades da escola.</p>
        <ul className="cn-group-cards">
          {groups.map((g) => (
            <li key={g.id} className="cn-group-cards__item">
              <div>
                <strong>{g.name}</strong>
                <p>{g.description}</p>
                <span>{g.memberCount} membros</span>
              </div>
              <button
                type="button"
                className={`cn-btn ${g.isMember ? "cn-btn--ghost" : "cn-btn--primary"}`}
                disabled={busy === g.id}
                onClick={() => void toggle(g)}
              >
                {g.isMember ? "Sair" : "Entrar"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </CommunityLayout>
  );
}
