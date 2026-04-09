"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "ttukddak_favorites";

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Track whether we've completed the initial DB sync so we don't write localStorage
  // while logged-in (we rely on DB as source of truth).
  const dbSyncedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      // 1. Load from localStorage immediately for fast hydration
      let localFavorites: string[] = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          localFavorites = JSON.parse(stored);
        }
      } catch {
        // localStorage unavailable — ignore
      }

      // 2. Check auth state
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsLoggedIn(true);

        // 3. Fetch favorites from DB
        let dbFavorites: string[] = [];
        try {
          const res = await fetch("/api/favorites");
          if (res.ok) {
            const json = await res.json();
            dbFavorites = json.data ?? [];
          }
        } catch {
          // Network error — fall back to localStorage
        }

        // 4. Merge: union of localStorage + DB
        const merged = Array.from(new Set([...localFavorites, ...dbFavorites]));

        // 5. Sync any local-only items to DB
        const localOnly = merged.filter((id) => !dbFavorites.includes(id));
        for (const serviceId of localOnly) {
          fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceId }),
          }).catch(() => {});
        }

        // 6. Clear localStorage (DB is now the source of truth)
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }

        dbSyncedRef.current = true;
        setFavorites(merged);
      } else {
        setIsLoggedIn(false);
        setFavorites(localFavorites);
      }

      setLoaded(true);
    }

    init();

    // Listen for auth state changes (login/logout during session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setIsLoggedIn(true);

          // Re-run merge on login
          let localFavorites: string[] = [];
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) localFavorites = JSON.parse(stored);
          } catch {}

          let dbFavorites: string[] = [];
          try {
            const res = await fetch("/api/favorites");
            if (res.ok) {
              const json = await res.json();
              dbFavorites = json.data ?? [];
            }
          } catch {}

          const merged = Array.from(new Set([...localFavorites, ...dbFavorites]));
          const localOnly = merged.filter((id) => !dbFavorites.includes(id));
          for (const serviceId of localOnly) {
            fetch("/api/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ serviceId }),
            }).catch(() => {});
          }

          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}

          dbSyncedRef.current = true;
          setFavorites(merged);
        } else if (event === "SIGNED_OUT") {
          setIsLoggedIn(false);
          dbSyncedRef.current = false;
          // Start fresh in localStorage — don't persist removed DB items locally
          setFavorites([]);
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Persist to localStorage only when NOT logged in
  useEffect(() => {
    if (!loaded) return;
    if (isLoggedIn) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites, loaded, isLoggedIn]);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const adding = !favorites.includes(id);

      setFavorites((prev) =>
        adding ? [...prev, id] : prev.filter((f) => f !== id)
      );

      if (isLoggedIn) {
        // Sync to DB
        fetch("/api/favorites", {
          method: adding ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId: id }),
        }).catch(() => {});
      }
    },
    [favorites, isLoggedIn]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
