export default function CommunityWelcomeBanner() {
  return (
    <section className="cn-welcome cn-glass" aria-label="Boas-vindas">
      <div className="cn-welcome__photo" role="img" aria-label="Campus GERABRIEL" />
      <div className="cn-welcome__overlay">
        <p className="cn-welcome__eyebrow">Chat_Nações</p>
        <p className="cn-welcome__school">GERABRIEL Escola Profissional</p>
        <h2 className="cn-welcome__title">Juntos construímos o nosso futuro!</h2>
        <p className="cn-welcome__tagline">Conecta · Partilha · Cresce</p>
      </div>
    </section>
  );
}
