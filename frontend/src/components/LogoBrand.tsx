/** Proporção oficial do logotipo GERABRIEL (792×348 px). */
export const LOGO_GERABRIEL_ASPECT = 792 / 348;

const LOGO_SRC = "/logo-gerabriel.png?v=7";
/** Painel navy do login — gerado a partir do logo oficial (792×348) */
const LOGO_LOGIN_PANEL_SRC = "/logo-gerabriel-transparent.png?v=9";

type Props = {
  variant?: "dark" | "light" | "header" | "topbar";
  compact?: boolean;
  /** Fundo escuro no cabeçalho — painel branco subtil atrás do logo */
  onDark?: boolean;
  /** Logótipo completo «Escola GERABRIEL» no painel azul do login (mockup) */
  loginPanel?: boolean;
  showTagline?: boolean;
};

export default function LogoBrand({
  variant = "dark",
  compact = false,
  onDark = false,
  loginPanel = false,
  showTagline,
}: Props) {
  const height = loginPanel ? 132 : compact ? 72 : 120;
  const width = Math.round(height * LOGO_GERABRIEL_ASPECT);
  const taglineVisible = loginPanel ? false : showTagline ?? !compact;

  return (
    <div
      className={[
        "logo-brand",
        `logo-brand--${variant}`,
        compact ? "logo-brand--compact" : "",
        onDark ? "logo-brand--on-dark" : "",
        loginPanel ? "logo-brand--login-panel" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        src={loginPanel ? LOGO_LOGIN_PANEL_SRC : LOGO_SRC}
        alt="Escola Profissional GERABRIEL"
        className="logo-brand__img"
        width={width}
        height={height}
        decoding="async"
        fetchPriority="high"
      />
      {taglineVisible && (
        <p className="logo-brand__tagline">Chat_Nações · Comunidade Digital Escolar</p>
      )}
    </div>
  );
}
