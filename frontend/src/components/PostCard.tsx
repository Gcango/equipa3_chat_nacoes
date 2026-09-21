import { FormEvent, useState } from "react";
import type { Comment, Post } from "../api";
import { IcComment, IcHeart, IcMore, IcShare } from "./CommunityIcons";
import UserAvatar from "./UserAvatar";

const TYPE_LABEL: Record<string, string> = {
  NOTICIA: "Notícia escolar",
  PROJETO: "Projeto",
  EVENTO: "Evento",
  NORMAL: "",
};

type Props = {
  post: Post;
  variant?: "default" | "community";
  onReport: (id: string) => void;
  onLike: (id: string) => Promise<void>;
  onLoadComments: (id: string) => Promise<Comment[]>;
  onAddComment: (postId: string, content: string) => Promise<unknown>;
  onShare?: (postId: string) => void;
};

export default function PostCard({
  post,
  variant = "default",
  onReport,
  onLike,
  onLoadComments,
  onAddComment,
  onShare,
}: Props) {
  const isCommunity = variant === "community";
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const when = new Date(post.createdAt).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function toggleComments() {
    if (commentsOpen) {
      setCommentsOpen(false);
      return;
    }
    setLoadingComments(true);
    try {
      const list = await onLoadComments(post.id);
      setComments(list);
      setCommentsOpen(true);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleLike() {
    if (liking) return;
    setLiking(true);
    try {
      await onLike(post.id);
    } finally {
      setLiking(false);
    }
  }

  async function handleCommentSubmit(e: FormEvent) {
    e.preventDefault();
    const text = commentDraft.trim();
    if (!text) return;
    setSubmittingComment(true);
    try {
      await onAddComment(post.id, text);
      setCommentDraft("");
      const list = await onLoadComments(post.id);
      setComments(list);
      setCommentsOpen(true);
    } finally {
      setSubmittingComment(false);
    }
  }

  const relativeWhen = new Date(post.createdAt).toLocaleString("pt-PT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      className={`post-card${isCommunity ? " post-card--cn cn-glass" : ""}`}
      id={`post-${post.id}`}
    >
      <header className={`post-card__head${isCommunity ? " post-card__head--cn" : ""}`}>
        <UserAvatar name={post.author.name} size="md" />
        <div className="post-card__meta">
          <div className="post-card__author-row">
            <strong className="post-card__author">{post.author.name}</strong>
            {post.type !== "NORMAL" && (
              <span className="badge badge--institutional">{TYPE_LABEL[post.type] ?? post.type}</span>
            )}
          </div>
          <span className="post-card__sub">
            {isCommunity ? (
              <>
                {relativeWhen}
                {post.author.course && (
                  <>
                    {" · "}
                    <span className="post-card__tag">{post.author.course}</span>
                  </>
                )}
                <span className="post-card__privacy" title="Comunidade escolar">
                  {" · 🌐"}
                </span>
              </>
            ) : (
              <>
                {post.author.course}
                {post.author.classGroup ? ` · ${post.author.classGroup}` : ""} · {when}
              </>
            )}
          </span>
        </div>
        {isCommunity && (
          <div className="post-card__menu">
            <button
              type="button"
              className="post-card__menu-btn"
              aria-label="Opções"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <IcMore />
            </button>
            {menuOpen && (
              <>
                <button type="button" className="post-card__menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar" />
                <div className="post-card__menu-pop">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReport(post.id);
                    }}
                  >
                    Denunciar publicação
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>
      {isCommunity ? (
        <>
          <div className="post-card__text-cn">
            <p>{post.content}</p>
          </div>
          <div className="post-card__media-cn" aria-hidden>
            <div className="post-card__media-cn__inner">
              <span>Comunidade Digital Escolar</span>
            </div>
          </div>
        </>
      ) : (
        <div className="post-card__body">
          <p>{post.content}</p>
        </div>
      )}

      {isCommunity && (
        <div className="post-card__stats-cn">
          <span className="post-card__stats-cn__reactions">
            {(post._count?.reactions ?? 0) > 0 ? (
              <>
                <span aria-hidden>❤️</span>
                <span aria-hidden>👍</span>
                {post._count?.reactions}
              </>
            ) : (
              <span className="post-card__stats-cn__muted">Sê o primeiro a reagir</span>
            )}
          </span>
          <span className="post-card__stats-cn__comments">
            {(post._count?.comments ?? 0) > 0
              ? `${post._count?.comments} comentários`
              : "0 comentários"}
          </span>
        </div>
      )}

      <footer className={`post-card__actions${isCommunity ? " post-card__actions--cn" : ""}`}>
        <button
          type="button"
          className={`action-btn${post.likedByMe ? " action-btn--active" : ""}`}
          onClick={handleLike}
          disabled={liking}
          aria-pressed={post.likedByMe}
        >
          {isCommunity ? <IcHeart /> : <span className="action-btn__icon" aria-hidden>👍</span>}
          Gosto{!isCommunity ? ` · ${post._count?.reactions ?? 0}` : ""}
        </button>
        <button
          type="button"
          className={`action-btn${commentsOpen ? " action-btn--active" : ""}`}
          onClick={toggleComments}
          disabled={loadingComments}
          aria-expanded={commentsOpen}
        >
          {isCommunity ? <IcComment /> : <span className="action-btn__icon" aria-hidden>💬</span>}
          {loadingComments ? "A carregar…" : isCommunity ? "Comentar" : `Comentar · ${post._count?.comments ?? 0}`}
        </button>
        {isCommunity ? (
          <button type="button" className="action-btn" onClick={() => onShare?.(post.id)}>
            <IcShare />
            Partilhar
          </button>
        ) : (
          <button type="button" className="action-btn action-btn--muted" onClick={() => onReport(post.id)}>
            Denunciar
          </button>
        )}
      </footer>

      {commentsOpen && (
        <section className="post-card__comments" aria-label="Comentários">
          {comments.length === 0 && (
            <p className="post-card__comments-empty">Ainda não há comentários. Sê o primeiro.</p>
          )}
          <ul className="comment-list">
            {comments.map((c) => (
              <li key={c.id} className="comment-list__item">
                <UserAvatar name={c.author.name} size="sm" />
                <div>
                  <strong>{c.author.name}</strong>
                  <span className="comment-list__when">
                    {new Date(c.createdAt).toLocaleString("pt-PT", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <p>{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <label className="sr-only" htmlFor={`comment-${post.id}`}>
              Novo comentário
            </label>
            <input
              id={`comment-${post.id}`}
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Escreve um comentário respeitoso…"
              maxLength={2000}
            />
            <button type="submit" className="btn btn--primary btn--sm" disabled={submittingComment}>
              {submittingComment ? "…" : "Comentar"}
            </button>
          </form>
        </section>
      )}
    </article>
  );
}
