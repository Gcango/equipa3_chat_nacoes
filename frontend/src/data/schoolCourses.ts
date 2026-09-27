/** Cursos profissionais EP Gerabriel — navegação e página A escola. */
export type SchoolCourse = {
  id: string;
  abbr: string;
  name: string;
  /** Breve descrição para o painel do cabeçalho. */
  teaser: string;
  /** true = texto provisório até confirmação da escola */
  placeholder?: boolean;
};

export const SCHOOL_COURSES: SchoolCourse[] = [
  {
    id: "pi",
    abbr: "P.I.",
    name: "Programadores de Informática",
    teaser: "Desenvolvimento de software, bases de dados e projectos digitais.",
  },
  {
    id: "tc",
    abbr: "T.C.",
    name: "Técnicos de Comércio",
    teaser: "Gestão comercial, marketing e atendimento ao cliente.",
  },
  {
    id: "trb",
    abbr: "T.R.B.",
    name: "Técnicos de Restaurante e Bar",
    teaser: "Cozinha, sala e serviço de restauração e bebidas.",
  },
  {
    id: "tma",
    abbr: "T.M.A.",
    name: "Técnico de Mecatrónica e Automóveis",
    teaser: "Veículos, sistemas mecatrónicos e diagnóstico técnico.",
  },
  {
    id: "tmi",
    abbr: "T.M.I.",
    name: "Técnico de Manutenção Industrial",
    teaser: "Instalações, manutenção preventiva e segurança industrial.",
  },
  {
    id: "tdc",
    abbr: "T.D.C.",
    name: "Técnico de Desenho de Construção Civil",
    teaser: "Projecto, levantamentos e apoio à construção civil.",
  },
  {
    id: "curso-7",
    abbr: "—",
    name: "Outro curso (a definir)",
    teaser: "Nome e área a confirmar com a direcção da escola.",
    placeholder: true,
  },
  {
    id: "curso-8",
    abbr: "—",
    name: "Outro curso (a definir)",
    teaser: "Nome e área a confirmar com a direcção da escola.",
    placeholder: true,
  },
];

export function courseAnchor(id: string) {
  return `curso-${id}`;
}
