import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import UserAvatar from "../components/UserAvatar";
import { fetchMe, updateProfile, type User } from "../api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setUser(u);
        setBio(u.bio ?? "");
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const updated = await updateProfile({ bio });
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!user) return null;

  return (
    <AppShell user={user} onLogout={logout}>
      <div className="page-narrow">
      <div className="panel card">
        <div className="composer__head page-section-head">
          <UserAvatar name={user.name} size="lg" />
          <div>
            <h2 className="page-section-head__title">O meu perfil</h2>
            <p className="composer__hint">Informação visível na comunidade escolar</p>
          </div>
        </div>
        <dl className="profile-dl">
          <dt>Nome</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Curso / Turma</dt>
          <dd>
            {user.course} · {user.classGroup}
          </dd>
          <dt>Estado</dt>
          <dd>
            {{
              ATIVO: "Activa",
              PENDENTE: "Pendente",
              SUSPENSO: "Suspensa",
              BLOQUEADO: "Bloqueada",
            }[user.status] ?? user.status}
          </dd>
        </dl>
        <form onSubmit={onSave} className="form">
          <label>
            Bio
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={4} />
          </label>
          <button type="submit" className="btn btn--primary">
            Guardar
          </button>
          {saved && <span className="form-success"> Perfil actualizado.</span>}
        </form>
      </div>
      </div>
    </AppShell>
  );
}
