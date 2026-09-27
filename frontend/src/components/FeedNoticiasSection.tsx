import { useEffect, useState } from "react";
import {
  addComment,
  fetchComments,
  fetchPosts,
  toggleReaction,
  type Post,
} from "../api";
import PostCard from "./PostCard";

type Props = {
  onReport: (postId: string) => void;
  onReload?: () => void;
};

export default function FeedNoticiasSection({ onReport, onReload }: Props) {
  const [noticias, setNoticias] = useState<Post[]>([]);

  useEffect(() => {
    fetchPosts("NOTICIA")
      .then((list) => setNoticias(list.slice(0, 5)))
      .catch(() => setNoticias([]));
  }, []);

  if (noticias.length === 0) return null;

  return (
    <section className="cn-noticias-block cn-glass" aria-labelledby="cn-noticias-heading">
      <header className="cn-noticias-block__head">
        <h2 id="cn-noticias-heading" className="cn-noticias-block__title">
          Notícias da escola
        </h2>
        <p className="cn-noticias-block__sub">Comunicação oficial e avisos da EP Gabriel</p>
      </header>
      <div className="cn-noticias-block__list">
        {noticias.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            variant="community"
            onReport={onReport}
            onLike={async (id) => {
              await toggleReaction(id);
              onReload?.();
            }}
            onLoadComments={fetchComments}
            onAddComment={addComment}
          />
        ))}
      </div>
    </section>
  );
}
