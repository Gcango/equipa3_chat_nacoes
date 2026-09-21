import { useEffect, useState } from "react";
import CommunityLayout from "../../components/CommunityLayout";
import { fetchSchoolProfile, type SchoolProfile } from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function SchoolIdentityPage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    fetchSchoolProfile()
      .then(setSchool)
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
        {school && (
          <>
            <h2 className="cn-page__title">{school.name}</h2>
            <p className="cn-page__lead">{school.motto}</p>
            <p className="cn-page__muted">{school.tagline}</p>
            <h3 className="cn-page__subtitle">Valores</h3>
            <ul className="cn-page__bullets">
              {school.values.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
            <h3 className="cn-page__subtitle">Contactos</h3>
            <ul className="cn-page__bullets">
              {school.contacts.map((c) => (
                <li key={c.label}>
                  <strong>{c.label}:</strong>{" "}
                  <a href={c.value.startsWith("mailto:") ? c.value : `mailto:${c.value}`}>
                    {c.value.replace(/^mailto:/, "")}
                  </a>
                </li>
              ))}
            </ul>
            <p className="cn-page__muted">Rede privada {school.emailDomain}</p>
          </>
        )}
      </section>
    </CommunityLayout>
  );
}
