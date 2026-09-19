type Props = {
  variant?: "dark" | "light" | "header" | "topbar";
  compact?: boolean;
};

/** Logotipo GERABRIEL oficial (prata + azul elétrico) */
export default function LogoBrand({ variant = "dark", compact = false }: Props) {
  return (
    <div
      className={`logo-brand logo-brand--${variant}${compact ? " logo-brand--compact" : ""}`}
    >
      <img
        src="/logo-gerabriel.png?v=6"
        alt="GERABRIEL — Escola Profissional"
        className="logo-brand__img"
        width={compact ? 280 : 320}
        height={compact ? 100 : 120}
        decoding="async"
      />
      {!compact && (
        <p className="logo-brand__tagline">Chat_Nações · Comunidade Digital Escolar</p>
      )}
    </div>
  );
}
