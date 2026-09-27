import { useEffect, useState } from "react";
import CommunityLayout from "../../components/CommunityLayout";
import { fetchResourceLinks, fetchSchoolProfile, type ResourceLink, type SchoolProfile } from "../../api";
import { SCHOOL_COURSES, courseAnchor } from "../../data/schoolCourses";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function SchoolIdentityPage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [localError, setLocalError] = useState("");

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

        <h3 className="cn-page__subtitle cn-page__subtitle--section" id="cursos">
          Cursos profissionais
        </h3>
        <p className="cn-page__lead cn-page__lead--compact">
          Oferta formativa da escola — escolhe o teu curso na barra azul ou explora aqui em detalhe.
        </p>
        <ul className="cn-courses-grid">
          {SCHOOL_COURSES.map((c) => (
            <li key={c.id} id={courseAnchor(c.id)} className="cn-courses-grid__item cn-glass">
              <p className="cn-courses-grid__abbr">{c.abbr}</p>
              <h4 className="cn-courses-grid__name">{c.name}</h4>
              <p className="cn-courses-grid__teaser">{c.teaser}</p>
              {c.placeholder && <span className="cn-courses-grid__badge">A confirmar</span>}
            </li>
          ))}
        </ul>

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
