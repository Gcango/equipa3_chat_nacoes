import type { ReactNode } from "react";
import type { CommunitySummary, User } from "../api";
import { CommunityNavProvider, useCommunityNav } from "../context/CommunityNavContext";
import AppShell from "./AppShell";
import CommunityFeedWidgets from "./CommunityFeedWidgets";
import CommunitySettingsDrawer from "./CommunitySettingsDrawer";

type Props = {
  user: User | null;
  displayUser: User | null;
  onLogout: () => void;
  summary: CommunitySummary;
  error?: string;
  showWidgets?: boolean;
  children: ReactNode;
};

function CommunityLayoutBody({
  user,
  displayUser,
  onLogout,
  summary,
  error,
  showWidgets = true,
  children,
}: Props) {
  const nav = useCommunityNav();

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      communityFeed
      communitySummary={summary}
      communityNavOpen={nav?.navOpen ?? false}
      onCommunityNavClose={nav?.closeNav}
      communityDrawer={
        displayUser && nav ? (
          <CommunitySettingsDrawer
            open={nav.navOpen}
            user={displayUser}
            summary={summary}
            onClose={nav.closeNav}
            onLogout={onLogout}
          />
        ) : null
      }
    >
      <div className={`cn-dash${nav?.navOpen ? " cn-dash--nav-open" : ""}`}>
        <div className="cn-dash__grid cn-dash__grid--menu">
          <main className="cn-dash__main" id="main-content" tabIndex={-1}>
            {error && <p className="cn-banner cn-banner--error">{error}</p>}
            {children}
          </main>
          {showWidgets && <CommunityFeedWidgets />}
        </div>
      </div>
    </AppShell>
  );
}

export default function CommunityLayout(props: Props) {
  return (
    <CommunityNavProvider>
      <CommunityLayoutBody {...props} />
    </CommunityNavProvider>
  );
}
