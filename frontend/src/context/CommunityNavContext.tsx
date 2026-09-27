import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type CommunityNavContextValue = {
  navOpen: boolean;
  toggleNav: () => void;
  closeNav: () => void;
};

const CommunityNavContext = createContext<CommunityNavContextValue | null>(null);

export function CommunityNavProvider({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const toggleNav = useCallback(() => setNavOpen((o) => !o), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  const value = useMemo(
    () => ({ navOpen, toggleNav, closeNav }),
    [navOpen, toggleNav, closeNav],
  );

  return <CommunityNavContext.Provider value={value}>{children}</CommunityNavContext.Provider>;
}

export function useCommunityNav() {
  const ctx = useContext(CommunityNavContext);
  return ctx;
}
