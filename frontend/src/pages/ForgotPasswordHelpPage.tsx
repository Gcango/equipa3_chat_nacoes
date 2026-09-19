import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoBrand from "../components/LogoBrand";

export default function ForgotPasswordHelpPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="login-gate">
      <div className="login-gate__inner login-gate__inner--wide">
        <div className="login-gate__brand">
          <LogoBrand variant="topbar" compact />
        </div>
        <div className="auth-card auth-card--elevated login-gate__card auth-help">
          <p className="auth-help__obs">OBS.</p>
          <h1 className="auth-card__heading">Esqueceste-te da palavra-passe?</h1>
          <p className="auth-card__lead">
            Não existe recuperação automática nesta plataforma. Segue estes passos na escola:
          </p>
          <ol className="auth-help__steps">
            <li>
              Dirige-te à <strong>secretaria</strong> ou fala com um elemento da{" "}
              <strong>direção</strong> durante o horário escolar.
            </li>
            <li>
              Identifica-te com o teu <strong>nome completo</strong>, <strong>turma</strong> e o{" "}
              <strong>e-mail escolar</strong> (@epgerabriel.edu.pt).
            </li>
            <li>
              A escola confirma a tua identidade e define uma <strong>nova palavra-passe</strong>{" "}
              (ou reactiva a conta, se estiver pendente).
            </li>
            <li>
              Volta ao ecrã de login e entra com o e-mail escolar e a palavra-passe que te
              indicarem.
            </li>
          </ol>
          <p className="auth-help__note">
            Se ainda não tens e-mail escolar, a secretaria cria a conta — não podes registar-te
            sozinho neste site.
          </p>
          <Link to="/login" className="btn btn--outline btn--block auth-help__back">
            Voltar ao login
          </Link>
        </div>
        <p className="login-gate__legal">Acesso reservado · Comunidade Digital Escolar</p>
      </div>
    </div>
  );
}
