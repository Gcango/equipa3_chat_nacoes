import { FormEvent, useEffect, useState } from "react";
import CommunityLayout from "../components/CommunityLayout";
import UserAvatar from "../components/UserAvatar";
import { fetchMe, updateProfile, type User } from "../api";
import { useAuthUser } from "../hooks/useAuthUser";

export default function ProfilePage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setProfile(u);
        setBio(u.bio ?? "");
      })
      .catch(() => {});
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const updated = await updateProfile({ bio });
    setProfile(updated);
    localStorage.setItem("user", JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const u = profile ?? displayUser;
  if (!u) return null;

  return (
    <CommunityLayout
      user={user}
      displayUser={displayUser}
      onLogout={logout}
      summary={summary}
      error={error}
      showWidgets={false}
    >
      <section className="cn-page cn-glass">
        <div className="composer__head page-section-head">
          <UserAvatar name={u.name} size="lg" />
          <div>
            <h2 className="cn-page__title">Definições · Perfil</h2>
            <p className="cn-page__lead">Informação visível na comunidade escolar</p>
          </div>
        </div>
        <dl className="profile-dl">
          <dt>Nome</dt>
          <dd>{u.name}</dd>
          <dt>Email</dt>
          <dd>{u.email}</dd>
          <dt>Curso / Turma</dt>
          <dd>
            {u.course} · {u.classGroup}
          </dd>
          <dt>Estado</dt>
          <dd>
            {{
              ATIVO: "Activa",
              PENDENTE: "Pendente",
              SUSPENSO: "Suspensa",
              BLOQUEADO: "Bloqueada",
            }[u.status] ?? u.status}
          </dd>
        </dl>
        <form onSubmit={onSave} className="form">
          <label>
            Bio
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={4} />
          </label>
          <button type="submit" className="cn-btn cn-btn--primary">
            Guardar
          </button>
          {saved && <span className="form-success"> Perfil actualizado.</span>}
        </form>
      </section>
    </CommunityLayout>
  );
}
