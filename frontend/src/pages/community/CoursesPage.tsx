import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import CommunityLayout from "../../components/CommunityLayout";
import SchoolCoursesGrid from "../../components/SchoolCoursesGrid";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function CoursesPage() {
  const { hash } = useLocation();
  const { user, displayUser, error, logout, summary } = useAuthUser();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace(/^#/, "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <CommunityLayout
      user={user}
      displayUser={displayUser}
      onLogout={logout}
      summary={summary}
      error={error}
      showWidgets={false}
    >
      <div className="cn-courses-page">
        <header className="cn-courses-hero">
          <div className="cn-courses-hero__inner cn-courses-hero__inner--solo">
            <p className="cn-courses-hero__kicker">Formação profissional · EP Gerabriel</p>
            <h1 className="cn-courses-hero__title">
              A escola apresenta cursos profissionais que unem teoria, prática e futuro.
            </h1>
            <p className="cn-courses-hero__statement">
              Oferta formativa nas áreas da informática, restauração e hotelaria, comércio e construção civil,
              com dupla certificação escolar e profissional e percursos orientados para a empregabilidade.
            </p>
            <p className="cn-courses-hero__statement">
              Formação assente em laboratórios e oficinas equipados, estágios em empresas parceiras e
              projectos que ligam a escola ao tecido económico e social da região.
            </p>
            <p className="cn-courses-hero__statement">
              A Comunidade Digital Escolar complementa o percurso em sala: recursos, comunicação com a escola
              e participação activa de alunos, docentes e encarregados de educação.
            </p>
          </div>
        </header>

        <section className="cn-courses-showcase" aria-label="Lista de cursos">
          <h2 className="cn-courses-showcase__heading">
            A Nossa Escola apresenta os seguintes cursos:
          </h2>
          <SchoolCoursesGrid />
        </section>
      </div>
    </CommunityLayout>
  );
}
