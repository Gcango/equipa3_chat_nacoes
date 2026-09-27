import { FormEvent, useEffect, useState } from "react";
import CommunityLayout from "../../components/CommunityLayout";
import PostCard from "../../components/PostCard";
import {
  addComment,
  createPost,
  fetchComments,
  fetchCommunityGroups,
  fetchPosts,
  joinCommunityGroup,
  leaveCommunityGroup,
  toggleReaction,
  type CommunityGroup,
  type Post,
} from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function GroupsPage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [projects, setProjects] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [localError, setLocalError] = useState("");

  async function loadGroups() {
    setGroups(await fetchCommunityGroups());
  }

  async function loadProjects() {
    setProjects(await fetchPosts("PROJETO"));
  }

  async function load() {
    await Promise.all([loadGroups(), loadProjects()]);
  }

  useEffect(() => {
    load().catch((e) => setLocalError(e instanceof Error ? e.message : "Erro."));
  }, []);

  async function toggle(g: CommunityGroup) {
    setBusy(g.id);
    try {
      if (g.isMember) await leaveCommunityGroup(g.id);
      else await joinCommunityGroup(g.id);
      await loadGroups();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setBusy(null);
    }
  }

  async function onPublishProject(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPublishing(true);
    try {
      await createPost(content.trim(), "PROJETO");
      setContent("");
      await loadProjects();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Erro ao publicar.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <CommunityLayout
      user={user}
      displayUser={displayUser}
      onLogout={logout}
      summary={summary}
      error={error || localError}
      showWidgets={false}
    >
      <section className="cn-page cn-glass">
        <h2 className="cn-page__title">Grupos e projectos</h2>
        <p className="cn-page__lead">
          Turmas, comunidades da escola e partilha de PAP, trabalhos e projectos escolares.
        </p>

        <h3 className="cn-page__subtitle cn-page__subtitle--section">Os meus grupos</h3>
        <ul className="cn-group-cards">
          {groups.map((g) => (
            <li key={g.id} className="cn-group-cards__item">
              <div>
                <strong>{g.name}</strong>
                <p>{g.description}</p>
                <span>{g.memberCount} membros</span>
              </div>
              <button
                type="button"
                className={`cn-btn ${g.isMember ? "cn-btn--ghost" : "cn-btn--primary"}`}
                disabled={busy === g.id}
                onClick={() => void toggle(g)}
              >
                {g.isMember ? "Sair" : "Entrar"}
              </button>
            </li>
          ))}
        </ul>

        <h3 className="cn-page__subtitle cn-page__subtitle--section" id="projectos">
          Projectos
        </h3>
        <form onSubmit={onPublishProject} className="cn-page__form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Descreve o teu projecto ou avanço de PAP…"
            rows={3}
            maxLength={5000}
          />
          <button type="submit" className="cn-btn cn-btn--primary" disabled={publishing || !content.trim()}>
            {publishing ? "A publicar…" : "Publicar projecto"}
          </button>
        </form>
      </section>

      <div className="cn-feed">
        {projects.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            variant="community"
            onReport={() => {}}
            onLike={async (id) => {
              await toggleReaction(id);
              await loadProjects();
            }}
            onLoadComments={fetchComments}
            onAddComment={addComment}
          />
        ))}
        {projects.length === 0 && (
          <div className="cn-empty cn-glass">
            <p>Ainda não há projectos publicados.</p>
          </div>
        )}
      </div>
    </CommunityLayout>
  );
}
