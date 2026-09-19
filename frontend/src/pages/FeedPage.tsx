import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import PostCard from "../components/PostCard";
import ReportModal from "../components/ReportModal";
import Toast from "../components/Toast";
import UserAvatar from "../components/UserAvatar";
import {
  addComment,
  createPost,
  fetchComments,
  fetchMe,
  fetchPosts,
  reportPost,
  toggleReaction,
  type Post,
  type User,
} from "../api";

export default function FeedPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  async function loadPosts() {
    const list = await fetchPosts();
    setPosts(list);
  }

  async function load() {
    try {
      const me = await fetchMe();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar feed.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onPublish(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPublishing(true);
    try {
      await createPost(content.trim());
      setContent("");
      await loadPosts();
      setToast({ message: "Publicação criada com sucesso.", variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao publicar.");
    } finally {
      setPublishing(false);
    }
  }

  async function onLike(postId: string) {
    await toggleReaction(postId);
    await loadPosts();
  }

  async function onReportSubmit(reason: string, description: string) {
    if (!reportPostId) return;
    await reportPost(reportPostId, reason, description);
    setToast({
      message: "Denúncia enviada. A moderação da escola irá analisar.",
      variant: "success",
    });
  }

  return (
    <AppShell
      user={user}
      onLogout={logout}
      hero={{
        title: "Bem-vindo à comunidade",
        subtitle: "Publicações, projetos e notícias da escola — num ambiente seguro e moderado.",
      }}
    >
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      )}

      <ReportModal
        open={reportPostId !== null}
        onClose={() => setReportPostId(null)}
        onSubmit={onReportSubmit}
      />

      <div className="layout-feed">
        <aside className="layout-feed__sidebar">
          {user && (
            <div className="side-card">
              <div className="side-card__profile">
                <UserAvatar name={user.name} size="lg" />
                <div>
                  <strong>{user.name}</strong>
                  <p>
                    {user.course}
                    {user.classGroup ? ` · ${user.classGroup}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="side-card side-card--info">
            <h3>Comunidade escolar</h3>
            <ul>
              <li>Conteúdo visível apenas a membros validados</li>
              <li>Respeito e moderação activa</li>
              <li>Denúncia disponível em cada publicação</li>
            </ul>
          </div>
        </aside>

        <div className="layout-feed__main">
          {error && <p className="banner banner--error">{error}</p>}

          <section className="composer card">
            <div className="composer__head">
              {user && <UserAvatar name={user.name} size="md" />}
              <div>
                <h2 className="composer__title">Criar publicação</h2>
                <p className="composer__hint">Partilha com a tua turma e a escola</p>
              </div>
            </div>
            <form onSubmit={onPublish} className="composer__form">
              <label className="sr-only" htmlFor="composer-content">
                Conteúdo da publicação
              </label>
              <textarea
                id="composer-content"
                className="composer__input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="O que queres partilhar hoje?"
                rows={3}
                maxLength={5000}
                required
              />
              <div className="composer__toolbar">
                <span className="composer__note">Comunicação respeitosa · @epgerabriel.edu.pt</span>
                <button type="submit" className="btn btn--primary" disabled={publishing}>
                  {publishing ? "A publicar…" : "Publicar"}
                </button>
              </div>
            </form>
          </section>

          <section className="feed">
            <div className="feed__heading">
              <h2>Feed da comunidade</h2>
              <span className="feed__count">{posts.length} publicações</span>
            </div>
            {posts.length === 0 && (
              <div className="empty-state card">
                <p>Ainda não há publicações.</p>
                <p className="empty-state__sub">Sê o primeiro a partilhar algo com a escola.</p>
              </div>
            )}
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReport={setReportPostId}
                onLike={onLike}
                onLoadComments={fetchComments}
                onAddComment={addComment}
              />
            ))}
            {posts.length >= 50 && (
              <p className="feed__limit-note">A mostrar as 50 publicações mais recentes.</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
