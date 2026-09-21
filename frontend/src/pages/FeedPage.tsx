import CommunityFeedStream from "../components/CommunityFeedStream";
import CommunityLayout from "../components/CommunityLayout";
import CommunityStories from "../components/CommunityStories";
import CommunityWelcomeBanner from "../components/CommunityWelcomeBanner";
import { useAuthUser } from "../hooks/useAuthUser";

/** Feed principal — publicações visíveis para toda a comunidade activa */
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
      <CommunityWelcomeBanner />

      {displayUser && <CommunityStories userName={displayUser.name} />}

      {displayUser ? (
        <CommunityFeedStream
          userName={displayUser.name}
          onPostsChange={() => setError("")}
        />
      ) : (
        <p className="cn-page__lead">Inicia sessão para ver e publicar no feed.</p>
      )}
    </CommunityLayout>
  );
}
