import { FormEvent, useEffect, useState } from "react";
import {
  adminAddSchedule,
  adminCreateCourse,
  adminCreateEvent,
  adminCreateResource,
  adminDeleteCourse,
  adminDeleteEvent,
  adminDeleteSchedule,
  adminFetchCourses,
  adminFetchEvents,
  adminPublishNews,
  adminUpdateCourse,
  type SchoolCourseRecord,
  type SchoolEvent,
} from "../api";
import { weekdayLabel } from "../utils/weekdayPt";

const emptyCourse = {
  slug: "",
  abbr: "",
  name: "",
  teaser: "",
  description: "",
  imagePath: "",
  sortOrder: 0,
  published: true,
};

type Props = {
  onToast: (msg: string) => void;
};

export default function DirecaoEscolaPanel({ onToast }: Props) {
  const [courses, setCourses] = useState<SchoolCourseRecord[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [news, setNews] = useState("");
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [scheduleCourseId, setScheduleCourseId] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    weekday: 1,
    startTime: "09:00",
    endTime: "10:30",
    room: "",
    label: "",
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    startsAt: "",
    location: "",
    description: "",
  });
  const [resourceForm, setResourceForm] = useState({
    title: "",
    url: "",
    category: "Geral",
    description: "",
    sortOrder: 0,
  });
  const [busy, setBusy] = useState(false);

  async function reload() {
    const [c, e] = await Promise.all([adminFetchCourses(), adminFetchEvents()]);
    setCourses(c);
    setEvents(e);
    if (!scheduleCourseId && c[0]) setScheduleCourseId(c[0].id);
  }

  useEffect(() => {
    reload().catch(() => onToast("Erro ao carregar dados da direcção."));
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await reload();
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Erro na operação.");
    } finally {
      setBusy(false);
    }
  }

  async function onPublishNews(e: FormEvent) {
    e.preventDefault();
    if (!news.trim()) return;
    await run(async () => {
      await adminPublishNews(news.trim());
      setNews("");
      onToast("Notícia publicada no feed.");
    });
  }

  async function onCreateCourse(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await adminCreateCourse({
        ...courseForm,
        slug: courseForm.slug.trim().toLowerCase(),
        imagePath: courseForm.imagePath || null,
      });
      setCourseForm(emptyCourse);
      onToast("Curso criado.");
    });
  }

  async function onAddSchedule(e: FormEvent) {
    e.preventDefault();
    if (!scheduleCourseId) return;
    await run(async () => {
      await adminAddSchedule(scheduleCourseId, {
        weekday: scheduleForm.weekday,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        room: scheduleForm.room || null,
        label: scheduleForm.label,
        sortOrder: 0,
      });
      setScheduleForm((s) => ({ ...s, label: "", room: "" }));
      onToast("Horário adicionado.");
    });
  }

  async function onCreateEvent(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await adminCreateEvent({
        title: eventForm.title,
        startsAt: new Date(eventForm.startsAt).toISOString(),
        location: eventForm.location || undefined,
        description: eventForm.description || undefined,
      });
      setEventForm({ title: "", startsAt: "", location: "", description: "" });
      onToast("Evento criado no calendário.");
    });
  }

  async function onCreateResource(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await adminCreateResource({
        title: resourceForm.title,
        url: resourceForm.url,
        category: resourceForm.category,
        description: resourceForm.description.trim() || null,
        sortOrder: resourceForm.sortOrder,
      });
      setResourceForm({ title: "", url: "", category: "Geral", description: "", sortOrder: 0 });
      onToast("Recurso adicionado em A escola.");
    });
  }

  const selectedCourse = courses.find((c) => c.id === scheduleCourseId);

  return (
    <div className="direcao-panel">
      <div className="panel card direcao-panel__block">
        <h2>Direcção escolar</h2>
        <p className="composer__hint">
          Publicar notícias, gerir cursos, horários, eventos e recursos — acesso reservado à administração.
        </p>
      </div>

      <div className="panel card direcao-panel__block">
        <h3>Publicar notícia</h3>
        <form onSubmit={onPublishNews} className="form">
          <label className="form__full">
            Texto (aparece no feed como notícia oficial)
            <textarea value={news} onChange={(e) => setNews(e.target.value)} rows={4} required />
          </label>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            Publicar notícia
          </button>
        </form>
      </div>

      <div className="panel card direcao-panel__block">
        <h3>Cursos profissionais</h3>
        <form onSubmit={onCreateCourse} className="form form--grid">
          <label>
            Sigla
            <input
              value={courseForm.abbr}
              onChange={(e) => setCourseForm({ ...courseForm, abbr: e.target.value })}
              required
            />
          </label>
          <label>
            Slug (url)
            <input
              value={courseForm.slug}
              onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
              placeholder="ex: pi"
              required
            />
          </label>
          <label className="form__full">
            Nome
            <input
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              required
            />
          </label>
          <label className="form__full">
            Resumo curto
            <input
              value={courseForm.teaser}
              onChange={(e) => setCourseForm({ ...courseForm, teaser: e.target.value })}
              required
            />
          </label>
          <label className="form__full">
            Descrição
            <textarea
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              rows={3}
              required
            />
          </label>
          <label className="form__full">
            Imagem (caminho em /public)
            <input
              value={courseForm.imagePath}
              onChange={(e) => setCourseForm({ ...courseForm, imagePath: e.target.value })}
              placeholder="/courses/pi.png"
            />
          </label>
          <button type="submit" className="btn btn--primary form__full" disabled={busy}>
            Adicionar curso
          </button>
        </form>

        <ul className="admin-list direcao-panel__list">
          {courses.map((c) => (
            <li key={c.id}>
              <span>
                <strong>{c.abbr}</strong> {c.name}{" "}
                {!c.published && <em>(oculto)</em>}
              </span>
              <span className="direcao-panel__actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await adminUpdateCourse(c.id, { published: !c.published });
                      onToast(c.published ? "Curso ocultado." : "Curso visível.");
                    })
                  }
                >
                  {c.published ? "Ocultar" : "Publicar"}
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await adminDeleteCourse(c.id);
                      onToast("Curso removido.");
                    })
                  }
                >
                  Remover
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel card direcao-panel__block">
        <h3>Horários por curso</h3>
        <label>
          Curso
          <select value={scheduleCourseId} onChange={(e) => setScheduleCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.abbr} {c.name}
              </option>
            ))}
          </select>
        </label>
        {selectedCourse && selectedCourse.schedules && selectedCourse.schedules.length > 0 && (
          <ul className="admin-list direcao-panel__schedules">
            {selectedCourse.schedules.map((s) => (
              <li key={s.id}>
                <span>
                  {weekdayLabel(s.weekday)} {s.startTime}–{s.endTime} · {s.label}
                  {s.room ? ` (${s.room})` : ""}
                </span>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await adminDeleteSchedule(s.id);
                      onToast("Horário removido.");
                    })
                  }
                >
                  Apagar
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={onAddSchedule} className="form form--grid">
          <label>
            Dia
            <select
              value={scheduleForm.weekday}
              onChange={(e) => setScheduleForm({ ...scheduleForm, weekday: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {weekdayLabel(d)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Início
            <input
              value={scheduleForm.startTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
              pattern="\d{2}:\d{2}"
              required
            />
          </label>
          <label>
            Fim
            <input
              value={scheduleForm.endTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
              pattern="\d{2}:\d{2}"
              required
            />
          </label>
          <label>
            Sala
            <input
              value={scheduleForm.room}
              onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
            />
          </label>
          <label className="form__full">
            Actividade / disciplina
            <input
              value={scheduleForm.label}
              onChange={(e) => setScheduleForm({ ...scheduleForm, label: e.target.value })}
              required
            />
          </label>
          <button type="submit" className="btn btn--primary form__full" disabled={busy || !scheduleCourseId}>
            Guardar horário
          </button>
        </form>
      </div>

      <div className="panel card direcao-panel__block">
        <h3>Eventos (calendário)</h3>
        <form onSubmit={onCreateEvent} className="form form--grid">
          <label className="form__full">
            Título
            <input
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              required
            />
          </label>
          <label>
            Data e hora
            <input
              type="datetime-local"
              value={eventForm.startsAt}
              onChange={(e) => setEventForm({ ...eventForm, startsAt: e.target.value })}
              required
            />
          </label>
          <label>
            Local
            <input
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
            />
          </label>
          <label className="form__full">
            Descrição
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={2}
            />
          </label>
          <button type="submit" className="btn btn--primary form__full" disabled={busy}>
            Criar evento
          </button>
        </form>
        <ul className="admin-list">
          {events.map((ev) => (
            <li key={ev.id}>
              <span>
                {ev.title} — {new Date(ev.startsAt).toLocaleString("pt-PT")}
              </span>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await adminDeleteEvent(ev.id);
                    onToast("Evento removido.");
                  })
                }
              >
                Apagar
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel card direcao-panel__block">
        <h3>Recursos (A escola)</h3>
        <form onSubmit={onCreateResource} className="form form--grid">
          <label className="form__full">
            Título
            <input
              value={resourceForm.title}
              onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
              required
            />
          </label>
          <label className="form__full">
            URL
            <input
              type="url"
              value={resourceForm.url}
              onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
              required
            />
          </label>
          <label>
            Categoria
            <input
              value={resourceForm.category}
              onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
              required
            />
          </label>
          <label className="form__full">
            Descrição
            <input
              value={resourceForm.description}
              onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
            />
          </label>
          <button type="submit" className="btn btn--primary form__full" disabled={busy}>
            Adicionar recurso
          </button>
        </form>
        <p className="composer__hint">Para remover recursos antigos, contacta suporte ou usa a API admin.</p>
      </div>
    </div>
  );
}
