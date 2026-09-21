import { FormEvent, useCallback, useEffect, useState } from "react";
import PostCard from "./PostCard";
import ReportModal from "./ReportModal";
import Toast from "./Toast";
import UserAvatar from "./UserAvatar";
import {
  addComment,
  createPost,
  fetchComments,
  fetchPosts,
  reportPost,
  toggleReaction,
  type Post,
} from "../api";

type Props = {
  userName: string;
  onPostsChange?: (count: number) => void;
};

export default function CommunityFeedStream({ userName, onPostsChange }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const firstName = userName.split(" ")[0] ?? "Aluno";

  const loadPosts = useCallback(async () => {
    const list = await fetchPosts();
    setPosts(list);
    onPostsChange?.(list.length);
    setLoadError("");
  }, [onPostsChange]);

  useEffect(() => {
    loadPosts().catch((err) => {
      setLoadError(err instanceof Error ? err.message : "Não foi possível carregar o feed.");
    });
  }, [loadPosts]);

  async function onPublish(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPublishing(true);
    try {
      await createPost(content.trim());
      setContent("");
      setComposerOpen(false);
      await loadPosts();
      setToast({
        message: "Publicação partilhada — visível para toda a comunidade.",
        variant: "success",
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erro ao publicar.");
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

  function onShare(postId: string) {
    const url = `${window.location.origin}/feed#post-${postId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setToast({ message: "Ligação copiada para partilhar.", variant: "success" });
    });
  }

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      )}

      <ReportModal
        open={reportPostId !== null}
        onClose={() => setReportPostId(null)}
        onSubmit={onReportSubmit}
      />

      {loadError && (
        <div className="cn-banner cn-banner--error cn-feed-stream__error">
          <p>{loadError}</p>
          <button type="button" className="cn-btn cn-btn--ghost" onClick={() => void loadPosts()}>
            Tentar novamente
          </button>
        </div>
      )}

      <section className="cn-composer cn-glass" aria-label="Nova publicação">
        <div className="cn-composer__row">
          <UserAvatar name={userName} size="md" />
          <button
            type="button"
            className="cn-composer__trigger"
            onClick={() => setComposerOpen(true)}
          >
            O que estás a pensar, {firstName}?
          </button>
        </div>
        {(composerOpen || content) && (
          <form onSubmit={onPublish} className="cn-composer__form">
            <label className="sr-only" htmlFor="composer-content">
              Nova publicação
            </label>
            <textarea
              id="composer-content"
              className="cn-composer__input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partilha com toda a comunidade escolar…"
              rows={3}
              maxLength={5000}
              autoFocus
            />
            <div className="cn-composer__submit">
              <button
                type="button"
                className="cn-btn cn-btn--ghost"
                onClick={() => {
                  setComposerOpen(false);
                  setContent("");
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="cn-btn cn-btn--primary"
                disabled={publishing || !content.trim()}
              >
                {publishing ? "A publicar…" : "Publicar na comunidade"}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="cn-feed" id="feed-posts">
        {posts.length === 0 && !loadError && (
          <div className="cn-empty cn-glass">
            <p>Ainda não há publicações.</p>
            <p>Sê o primeiro a partilhar — todos os alunos e professores activos veem o feed.</p>
          </div>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            variant="community"
            onReport={setReportPostId}
            onLike={onLike}
            onLoadComments={fetchComments}
            onAddComment={addComment}
            onShare={onShare}
          />
        ))}
        {posts.length >= 50 && (
          <p className="cn-feed__note">A mostrar as 50 publicações mais recentes.</p>
        )}
      </div>
    </>
  );
}
