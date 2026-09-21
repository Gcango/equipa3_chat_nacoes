import { useEffect, useState } from "react";
import CommunityLayout from "../../components/CommunityLayout";
import { fetchResourceLinks, type ResourceLink } from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function ResourcesPage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    fetchResourceLinks()
      .then(setResources)
      .catch((e) => setLocalError(e instanceof Error ? e.message : "Erro."));
  }, []);

  const byCategory = resources.reduce<Record<string, ResourceLink[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

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
        <h2 className="cn-page__title">Recursos</h2>
        {Object.entries(byCategory).map(([cat, list]) => (
          <div key={cat} className="cn-resource-block">
            <h3 className="cn-page__subtitle">{cat}</h3>
            <ul className="cn-resource-list">
              {list.map((r) => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    <strong>{r.title}</strong>
                    {r.description && <span>{r.description}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </CommunityLayout>
  );
}
