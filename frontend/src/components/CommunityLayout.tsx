import type { ReactNode } from "react";
import type { CommunitySummary, User } from "../api";
import AppShell from "./AppShell";
import CommunityFeedSidebar from "./CommunityFeedSidebar";
import CommunityFeedWidgets from "./CommunityFeedWidgets";

type Props = {
  user: User | null;
  displayUser: User | null;
  onLogout: () => void;
  summary: CommunitySummary;
  error?: string;
  showWidgets?: boolean;
  children: ReactNode;
};

export default function CommunityLayout({
  user,
  displayUser,
  onLogout,
  summary,
  error,
  showWidgets = true,
  children,
}: Props) {
  return (
    <AppShell user={user} onLogout={onLogout} communityFeed communitySummary={summary}>
      <div className="cn-dash">
        <div className="cn-dash__grid">
          {displayUser && (
            <CommunityFeedSidebar user={displayUser} summary={summary} />
          )}

          <main className="cn-dash__main">
            {error && <p className="cn-banner cn-banner--error">{error}</p>}
            {children}
          </main>

          {showWidgets && <CommunityFeedWidgets />}
        </div>
      </div>
    </AppShell>
  );
}
