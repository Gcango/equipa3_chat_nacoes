import { FormEvent, useEffect, useState } from "react";
import CommunityLayout from "../components/CommunityLayout";
import ProfileAvatarEditor from "../components/ProfileAvatarEditor";
import { fetchMe, updateProfile, type User } from "../api";
import { useAuthUser } from "../hooks/useAuthUser";

export default function ProfilePage() {
  const { user, displayUser, error, logout, summary, reload } = useAuthUser();
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
    void reload();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function onAvatarUpdated(avatarUrl: string | null) {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, avatarUrl };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
    void reload();
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
      <section className="cn-page cn-page--profile">
        <header className="cn-page-profile__head">
          <div>
            <p className="cn-page-profile__kicker">Definições</p>
            <h2 className="cn-page__title">O teu perfil</h2>
            <p className="cn-page__lead">Foto, bio e dados visíveis na comunidade escolar</p>
          </div>
        </header>

        <div className="cn-page-profile__grid">
          <ProfileAvatarEditor
            name={u.name}
            avatarUrl={u.avatarUrl}
            onUpdated={onAvatarUpdated}
          />

          <div className="cn-page-profile__details">
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
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Conta um pouco sobre ti (opcional)…"
                />
              </label>
              <button type="submit" className="cn-btn cn-btn--primary">
                Guardar bio
              </button>
              {saved && <span className="form-success"> Perfil actualizado.</span>}
            </form>
          </div>
        </div>
      </section>
    </CommunityLayout>
  );
}
