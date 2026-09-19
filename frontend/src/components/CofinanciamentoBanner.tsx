type Props = {
  className?: string;
};

/** Faixa oficial de cofinanciamento (Portugal 2030 / UE) */
export default function CofinanciamentoBanner({ className = "" }: Props) {
  return (
    <div className={`cofin-banner${className ? ` ${className}` : ""}`}>
      <img
        src="/cofinanciamento-portugal-2030.png"
        alt="Cofinanciado por Portugal 2030, Pessoas 2030 e União Europeia"
        className="cofin-banner__img"
        width={960}
        height={120}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
