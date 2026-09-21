import { FormEvent, useEffect, useState } from "react";
import CommunityLayout from "../../components/CommunityLayout";
import PostCard from "../../components/PostCard";
import {
  addComment,
  createPost,
  fetchComments,
  fetchPosts,
  toggleReaction,
  type Post,
} from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function ProjectsPage() {
  const { user, displayUser, error, logout, summary } = useAuthUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [localError, setLocalError] = useState("");
  const [publishing, setPublishing] = useState(false);

  async function load() {
    setPosts(await fetchPosts("PROJETO"));
  }

  useEffect(() => {
    load().catch((e) => setLocalError(e instanceof Error ? e.message : "Erro."));
  }, []);

  async function onPublish(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPublishing(true);
    try {
      await createPost(content.trim(), "PROJETO");
      setContent("");
      await load();
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
        <h2 className="cn-page__title">Projetos</h2>
        <p className="cn-page__lead">Partilha avanços de PAP, trabalhos de grupo e projectos escolares.</p>
        <form onSubmit={onPublish} className="cn-page__form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Descreve o teu projecto…"
            rows={3}
            maxLength={5000}
          />
          <button type="submit" className="cn-btn cn-btn--primary" disabled={publishing || !content.trim()}>
            {publishing ? "A publicar…" : "Publicar projecto"}
          </button>
        </form>
      </section>
      <div className="cn-feed">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            variant="community"
            onReport={() => {}}
            onLike={async (id) => {
              await toggleReaction(id);
              await load();
            }}
            onLoadComments={fetchComments}
            onAddComment={addComment}
          />
        ))}
        {posts.length === 0 && (
          <div className="cn-empty cn-glass">
            <p>Ainda não há projectos publicados.</p>
          </div>
        )}
      </div>
    </CommunityLayout>
  );
}
