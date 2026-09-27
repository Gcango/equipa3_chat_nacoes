import CommunityFeedStream from "../components/CommunityFeedStream";
import CommunityLayout from "../components/CommunityLayout";
import CommunityStories from "../components/CommunityStories";
import { useAuthUser } from "../hooks/useAuthUser";

/** Feed principal — inclui notícias oficiais e publicações da comunidade */
export default function FeedPage() {
  const { user, displayUser, error, setError, logout, summary } = useAuthUser();

  return (
    <CommunityLayout
      user={user}
      displayUser={displayUser}
      onLogout={logout}
      summary={summary}
      error={error}
    >
      {displayUser ? (
        <CommunityFeedStream
          userName={displayUser.name}
          onPostsChange={() => setError("")}
          topSlot={<CommunityStories userName={displayUser.name} />}
        />
      ) : (
        <p className="cn-page__lead">Inicia sessão para ver e publicar no feed.</p>
      )}
    </CommunityLayout>
  );
}
