type Props = {
  title: string;
  subtitle?: string;
  compact?: boolean;
};

export default function HeroBanner({ title, subtitle, compact }: Props) {
  return (
    <section className={`hero${compact ? " hero--compact" : ""}`} aria-label="Destaque">
      <div className="hero__overlay" />
      <div className="hero__content">
        <h1 className="hero__title">{title}</h1>
        <span className="hero__accent" aria-hidden />
        {subtitle && <p className="hero__subtitle">{subtitle}</p>}
      </div>
    </section>
  );
}
