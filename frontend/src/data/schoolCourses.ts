/** Cursos profissionais EP Gerabriel — navegação e página de cursos. */
export type SchoolCourse = {
  id: string;
  abbr: string;
  name: string;
  /** Breve descrição para o painel do cabeçalho. */
  teaser: string;
  /** Texto alargado na página Cursos (estilo «O que fazemos»). */
  description: string;
  /** Imagem quadrada em /public/courses/ */
  image?: string;
  imageAlt?: string;
  /** true = texto provisório até confirmação da escola */
  placeholder?: boolean;
};

export const SCHOOL_COURSES: SchoolCourse[] = [
  {
    id: "pi",
    abbr: "P.I.",
    name: "Programadores de Informática",
    teaser: "Desenvolvimento de software, bases de dados e projectos digitais.",
    description:
      "Formação em programação, bases de dados, redes e projectos digitais. Os alunos desenvolvem aplicações, trabalham em equipa e preparam-se para estágios e emprego em empresas de IT e serviços.",
    image: "/courses/pi.png",
    imageAlt: "Programador a trabalhar em software numa estação com vários monitores",
  },
  {
    id: "tc",
    abbr: "T.C.",
    name: "Técnicos de Comércio",
    teaser: "Gestão comercial, marketing e atendimento ao cliente.",
    description:
      "Comércio, marketing, vendas e atendimento ao cliente. Enfatizamos negociação, comunicação profissional e espírito empreendedor, com ligação directa a retalho, serviços e gestão comercial.",
    image: "/courses/tc.png",
    imageAlt: "Aperto de mão entre profissionais de comércio",
  },
  {
    id: "trb",
    abbr: "T.R.B.",
    name: "Técnicos de Restaurante e Bar",
    teaser: "Cozinha, sala e serviço de restauração e bebidas.",
    description:
      "Cozinha, sala e bar com prática em laboratórios equipados. Os alunos aprendem técnicas culinárias, serviço de mesa, higiene e segurança alimentar, em contexto próximo do sector hoteleiro e da restauração.",
    image: "/courses/trb-cozinha.png",
    imageAlt: "Alunos de cozinha em uniforme a preparar pratos",
  },
  {
    id: "tma",
    abbr: "T.M.A.",
    name: "Técnico de Mecatrónica e Automóveis",
    teaser: "Veículos, sistemas mecatrónicos e diagnóstico técnico.",
    description:
      "Diagnóstico, reparação e manutenção de veículos e sistemas mecatrónicos. Formação hands-on em oficina, electrónica embarcada e segurança, alinhada com as exigências das oficinas e da indústria automóvel.",
    image: "/courses/tma.png",
    imageAlt: "Técnico automóvel a inspeccionar um veículo elevado",
  },
  {
    id: "tmi",
    abbr: "T.M.I.",
    name: "Técnico de Manutenção Industrial",
    teaser: "Instalações, manutenção preventiva e segurança industrial.",
    description:
      "Manutenção de equipamentos, instalações industriais e processos de produção. Foco em prevenção de avarias, segurança no trabalho e competências técnicas para fábricas, utilities e grandes unidades produtivas.",
    image: "/courses/tmi.png",
    imageAlt: "Técnicos em ambiente industrial com tubagens e estruturas",
  },
  {
    id: "tdc",
    abbr: "T.D.C.",
    name: "Técnico de Desenho de Construção Civil",
    teaser: "Projecto, levantamentos e apoio à construção civil.",
    description:
      "Desenho técnico, modelação e apoio a projectos de construção civil. Utilização de ferramentas digitais e papel, leitura de projectos e noções de obra, preparando para gabinetes de arquitectura e construção.",
    image: "/courses/tdc.png",
    imageAlt: "Técnico de construção civil com plantas e tablet",
  },
  {
    id: "curso-7",
    abbr: "—",
    name: "Outro curso (a definir)",
    teaser: "Nome e área a confirmar com a direcção da escola.",
    description: "Esta área de formação será anunciada pela direcção da escola. Consulta regularmente esta página ou contacta a secretaria.",
    placeholder: true,
  },
  {
    id: "curso-8",
    abbr: "—",
    name: "Outro curso (a definir)",
    teaser: "Nome e área a confirmar com a direcção da escola.",
    description: "Esta área de formação será anunciada pela direcção da escola. Consulta regularmente esta página ou contacta a secretaria.",
    placeholder: true,
  },
];

export function courseAnchor(id: string) {
  return `curso-${id}`;
}
