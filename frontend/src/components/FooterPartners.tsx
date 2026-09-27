type Partner = {
  name: string;
  src: string;
  alt: string;
};

const PARTNERS: Partner[] = [
  {
    name: "EP Gerabriel",
    src: "/partners/ep-gerabriel.png",
    alt: "Escola Profissional Gerabriel",
  },
  {
    name: "Pessoas 2030",
    src: "/partners/pessoas-2030.png",
    alt: "Programa Pessoas 2030",
  },
  {
    name: "Portugal 2030",
    src: "/partners/portugal-2030.png",
    alt: "Programa Portugal 2030",
  },
  {
    name: "União Europeia",
    src: "/partners/uniao-europeia.png",
    alt: "Cofinanciado pela União Europeia",
  },
];

export default function FooterPartners() {
  return (
    <div className="cn-footer__partners">
      <h3 className="cn-footer__partners-title">Os nossos parceiros</h3>
      <ul className="cn-footer-partners">
        {PARTNERS.map((p) => (
          <li key={p.name} className="cn-footer-partner">
            <div className="cn-footer-partner__disc">
              <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
            </div>
            <span className="cn-footer-partner__name">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
