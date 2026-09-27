import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchSchoolCourses, type SchoolCourseRecord } from "../api";
import { SCHOOL_COURSES, courseAnchor } from "../data/schoolCourses";

type NavLink = {
  to: string;
  label: string;
  desc?: string;
};

type NavItem = {
  to: string;
  label: string;
  isActive: (pathname: string, hash: string) => boolean;
  menu?: NavLink[];
  menuWide?: boolean;
};

const BASE_NAV: NavItem[] = [
  {
    to: "/feed",
    label: "Início",
    isActive: (p) => p === "/feed",
    menu: [{ to: "/feed", label: "Mural", desc: "Publicações e notícias da comunidade" }],
  },
  {
    to: "/calendario",
    label: "Calendário",
    isActive: (p) => p === "/calendario",
    menu: [{ to: "/calendario", label: "Agenda escolar", desc: "Eventos, reuniões e datas importantes" }],
  },
  {
    to: "/grupos",
    label: "Grupos",
    isActive: (p) => p.startsWith("/grupos"),
    menu: [
      { to: "/grupos", label: "Turmas e grupos", desc: "Comunidades por turma e área" },
      { to: "/grupos#projectos", label: "Projetos", desc: "PAP, trabalhos e partilhas escolares" },
    ],
  },
  {
    to: "/cursos",
    label: "Cursos",
    isActive: (p) => p === "/cursos",
    menuWide: true,
  },
  {
    to: "/escola",
    label: "A escola",
    isActive: (p) => p === "/escola",
    menu: [
      { to: "/escola", label: "Identidade", desc: "Missão, valores e contactos" },
      { to: "/escola#recursos", label: "Recursos", desc: "Ligações úteis e apoio" },
    ],
  },
];

function courseMenuLinks(courses: SchoolCourseRecord[]): NavLink[] {
  if (courses.length === 0) {
    return SCHOOL_COURSES.map((c) => ({
      to: `/cursos#${courseAnchor(c.id)}`,
      label: c.placeholder ? c.name : `${c.abbr} ${c.name}`,
      desc: c.teaser,
    }));
  }
  return courses
    .filter((c) => c.published)
    .map((c) => ({
      to: `/cursos#${courseAnchor(c.slug)}`,
      label: c.abbr === "—" ? c.name : `${c.abbr} ${c.name}`,
      desc: c.teaser,
    }));
}

function NavEntry({
  item,
  pathname,
  hash,
}: {
  item: NavItem;
  pathname: string;
  hash: string;
}) {
  const active = item.isActive(pathname, hash);
  const hasMenu = item.menu && item.menu.length > 0;

  const itemClass = `cn-school-nav__item${active ? " cn-school-nav__item--active" : ""}${
    hasMenu ? " cn-school-nav__item--has-menu" : ""
  }`;

  const trigger = (
    <Link to={item.to} className={itemClass}>
      <span className="cn-school-nav__label">{item.label}</span>
      {hasMenu && (
        <span className="cn-school-nav__caret" aria-hidden>
          ▾
        </span>
      )}
    </Link>
  );

  if (!hasMenu) {
    return trigger;
  }

  return (
    <div
      className={`cn-school-nav__drop-wrap${active ? " cn-school-nav__drop-wrap--active" : ""}${
        item.menuWide ? " cn-school-nav__drop-wrap--wide" : ""
      }`}
    >
      {trigger}
      <div
        className={`cn-school-nav__panel${item.menuWide ? " cn-school-nav__panel--wide" : ""}`}
        role="region"
        aria-label={`Opções: ${item.label}`}
      >
        <ul className="cn-school-nav__panel-list">
          {item.menu!.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="cn-school-nav__panel-link">
                <span className="cn-school-nav__panel-link-title">{link.label}</span>
                {link.desc && <span className="cn-school-nav__panel-link-desc">{link.desc}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function CommunitySchoolNav() {
  const { pathname, hash } = useLocation();
  const [courses, setCourses] = useState<SchoolCourseRecord[]>([]);

  useEffect(() => {
    fetchSchoolCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  const schoolNav = useMemo(() => {
    return BASE_NAV.map((item) =>
      item.label === "Cursos" ? { ...item, menu: courseMenuLinks(courses) } : item,
    );
  }, [courses]);

  return (
    <nav className="cn-school-nav" aria-label="Navegação escolar">
      <div className="cn-school-nav__inner">
        <div className="cn-school-nav__links">
          {schoolNav.map((item) => (
            <NavEntry key={item.label} item={item} pathname={pathname} hash={hash} />
          ))}
        </div>
      </div>
    </nav>
  );
}
