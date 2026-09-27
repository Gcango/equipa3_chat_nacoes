import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CommunityLayout from "../../components/CommunityLayout";
import { fetchResourceLinks, fetchSchoolProfile, type ResourceLink, type SchoolProfile } from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function SchoolIdentityPage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (hash === "#cursos" || hash.startsWith("#curso-")) {
      navigate(`/cursos${hash}`, { replace: true });
    }
  }, [hash, navigate]);

  useEffect(() => {
    Promise.all([fetchSchoolProfile(), fetchResourceLinks()])
      .then(([s, r]) => {
        setSchool(s);
        setResources(r);
      })
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
      <section className="cn-page cn-glass cn-page--escola" id="identidade">
        <p className="cn-page__kicker">Instituição</p>
        {school && (
          <>
            <h2 className="cn-page__title">{school.name}</h2>
            <p className="cn-page__lead">{school.motto}</p>
            <p className="cn-page__muted">{school.tagline}</p>
            <p className="cn-page__muted cn-page__lead--compact">
              Cursos e perfis de formação:{" "}
              <Link to="/cursos">ver Cursos profissionais</Link>.
            </p>
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

        <h3 className="cn-page__subtitle cn-page__subtitle--section" id="recursos">
          Recursos e apoio
        </h3>
        <p className="cn-page__lead cn-page__lead--compact">
          Ligações úteis para alunos, professores e encarregados de educação.
        </p>
        {Object.entries(byCategory).map(([cat, list]) => (
          <div key={cat} className="cn-resource-block">
            <h4 className="cn-page__subtitle">{cat}</h4>
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
        {resources.length === 0 && !localError && (
          <p className="cn-page__muted">Recursos em actualização.</p>
        )}
      </section>
    </CommunityLayout>
  );
}
