import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import PasswordInput from "../components/PasswordInput";
import Toast from "../components/Toast";
import {
  approveUser,
  createSchoolUser,
  fetchMe,
  fetchOpenReports,
  fetchPendingUsers,
  resolveReport,
  type AdminReport,
  type User,
} from "../api";

const REASON_LABEL: Record<string, string> = {
  BULLYING: "Bullying / assédio",
  INSULTO: "Insulto",
  AMEACA: "Ameaça",
  OFENSIVO: "Ofensivo",
  IMPROPRIO: "Impróprio",
  SPAM: "Spam",
  OUTRO: "Outro",
};

const emptyForm = {
  name: "",
  email: "",
  studentNumber: "",
  course: "",
  classGroup: "",
  password: "",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState<User[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [createMsg, setCreateMsg] = useState("");
  const [createErr, setCreateErr] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  async function load() {
    const me = await fetchMe();
    if (me.role !== "ADMIN") {
      navigate("/");
      return;
    }
    setUser(me);
    const [p, r] = await Promise.all([fetchPendingUsers(), fetchOpenReports()]);
    setPending(p);
    setReports(r);
  }

  useEffect(() => {
    load().catch(() => navigate("/login"));
  }, [navigate]);

  async function onApprove(id: string) {
    await approveUser(id);
    setToast("Utilizador aprovado — conta activa.");
    await load();
  }

  async function onCreateUser(e: FormEvent) {
    e.preventDefault();
    setCreateErr("");
    setCreateMsg("");
    try {
      const created = await createSchoolUser({
        ...form,
        email: form.email.trim().toLowerCase(),
      });
      setCreateMsg(`Conta criada: ${created.email} (activa). Entrega as credenciais ao aluno.`);
      setForm(emptyForm);
    } catch (err) {
      setCreateErr(err instanceof Error ? err.message : "Erro ao criar conta.");
    }
  }

  async function onResolveReport(
    report: AdminReport,
    status: "RESOLVIDA" | "REJEITADA",
    removePost: boolean,
  ) {
    setBusyReportId(report.id);
    try {
      await resolveReport(report.id, {
        status,
        removePost: removePost && report.targetType === "POST",
        resolutionNote: removePost
          ? "Conteúdo removido após análise."
          : status === "REJEITADA"
            ? "Denúncia arquivada sem acção."
            : "Denúncia tratada.",
      });
      setToast(removePost ? "Denúncia resolvida e publicação removida." : "Denúncia actualizada.");
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao resolver denúncia.");
    } finally {
      setBusyReportId(null);
    }
  }

  if (!user) return null;

  return (
    <AppShell
      user={user}
      onLogout={logout}
      hero={{ title: "Moderação", subtitle: "Gestão de contas, denúncias e segurança da comunidade." }}
    >
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="page-narrow admin-page">
        <div className="panel card">
          <h2>Criar conta escolar</h2>
          <p className="composer__hint">
            Escola privada — só a administração cria acessos (@epgerabriel.edu.pt).
          </p>
          <form onSubmit={onCreateUser} className="form form--grid">
            <label>
              Nome
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              E-mail escolar
              <input
                type="email"
                placeholder="aluno@epgerabriel.edu.pt"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              Nº aluno
              <input
                value={form.studentNumber}
                onChange={(e) => setForm({ ...form, studentNumber: e.target.value })}
                required
              />
            </label>
            <label>
              Curso
              <input
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                required
              />
            </label>
            <label>
              Turma
              <input
                value={form.classGroup}
                onChange={(e) => setForm({ ...form, classGroup: e.target.value })}
                required
              />
            </label>
            <label className="form__full">
              Palavra-passe inicial
              <PasswordInput
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </label>
            {createErr && <p className="form-error form__full">{createErr}</p>}
            {createMsg && <p className="form-success form__full">{createMsg}</p>}
            <button type="submit" className="btn btn--primary form__full">
              Criar conta activa
            </button>
          </form>
        </div>

        <div className="panel card">
          <h2>Registos pendentes</h2>
          <p className="composer__hint">Aprova contas criadas antes do fluxo só-admin (legado).</p>
          {pending.length === 0 && <p className="empty">Nenhum registo pendente.</p>}
          <ul className="admin-list">
            {pending.map((u) => (
              <li key={u.id}>
                <span>
                  {u.name} — {u.email} ({u.course} {u.classGroup})
                </span>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => onApprove(u.id)}
                >
                  Aprovar
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel card">
          <h2>Denúncias abertas</h2>
          {reports.length === 0 && <p className="empty">Nenhuma denúncia aberta.</p>}
          <ul className="admin-report-list">
            {reports.map((r) => (
              <li key={r.id} className="admin-report">
                <div className="admin-report__meta">
                  <span className="badge badge--institutional">
                    {REASON_LABEL[r.reason] ?? r.reason}
                  </span>
                  <span className="admin-report__by">
                    Denunciado por {r.reporter.name} ·{" "}
                    {new Date(r.createdAt).toLocaleString("pt-PT")}
                  </span>
                </div>
                {r.post && (
                  <blockquote className="admin-report__excerpt">
                    «{r.post.content.length > 220 ? `${r.post.content.slice(0, 220)}…` : r.post.content}»
                    <footer>
                      — {r.post.author.name} ({r.post.author.email})
                    </footer>
                  </blockquote>
                )}
                {r.description && <p className="admin-report__desc">{r.description}</p>}
                <div className="admin-report__actions">
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={busyReportId === r.id}
                    onClick={() => onResolveReport(r, "RESOLVIDA", true)}
                  >
                    Remover publicação
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    disabled={busyReportId === r.id}
                    onClick={() => onResolveReport(r, "RESOLVIDA", false)}
                  >
                    Marcar resolvida
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    disabled={busyReportId === r.id}
                    onClick={() => onResolveReport(r, "REJEITADA", false)}
                  >
                    Rejeitar denúncia
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
