import { useEffect, useState } from "react";
import { fetchSchoolCourses, type SchoolCourseRecord } from "../api";
import { SCHOOL_COURSES, courseAnchor } from "../data/schoolCourses";
import { weekdayLabel } from "../utils/weekdayPt";

function fallbackCourses(): SchoolCourseRecord[] {
  return SCHOOL_COURSES.map((c, i) => ({
    id: c.id,
    slug: c.id,
    abbr: c.abbr,
    name: c.name,
    teaser: c.teaser,
    description: c.description,
    imagePath: c.image ?? null,
    sortOrder: i,
    published: !c.placeholder,
    schedules: [],
  }));
}

export default function SchoolCoursesGrid() {
  const [courses, setCourses] = useState<SchoolCourseRecord[] | null>(null);

  useEffect(() => {
    fetchSchoolCourses()
      .then(setCourses)
      .catch(() => setCourses(fallbackCourses()));
  }, []);

  const list = courses ?? fallbackCourses();

  return (
    <ul className="cn-courses-showcase__grid">
      {list.filter((c) => c.published).map((c) => (
        <li key={c.id} id={courseAnchor(c.slug)} className="cn-courses-showcase__card">
          <div className="cn-courses-showcase__media">
            {c.imagePath ? (
              <img
                src={c.imagePath.startsWith("/") ? c.imagePath : `/${c.imagePath}`}
                alt={c.name}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="cn-courses-showcase__media-placeholder" aria-hidden>
                <span>{c.abbr}</span>
              </div>
            )}
          </div>
          <h3 className="cn-courses-showcase__title">
            {c.abbr === "—" ? c.name : `${c.abbr} ${c.name}`}
          </h3>
          <p className="cn-courses-showcase__text">{c.description}</p>
          {c.schedules && c.schedules.length > 0 && (
            <ul className="cn-courses-showcase__hours">
              {c.schedules.map((s) => (
                <li key={s.id}>
                  <strong>{weekdayLabel(s.weekday)}</strong> {s.startTime}–{s.endTime} · {s.label}
                  {s.room ? ` · ${s.room}` : ""}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
