import React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const storageKey = "vcs_auth";

function safeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    role: u.role
  };
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ready: false,
      accessToken: null,
      user: null,

      setSession: ({ accessToken, user }) =>
        set({ accessToken: accessToken || null, user: safeUser(user) }),
      setReady: (ready) => set({ ready: Boolean(ready) }),
      clear: () => set({ accessToken: null, user: null }),

      isAdmin: () => {
        const u = get().user;
        return u && u.role === "admin";
      }
    }),
    {
      name: storageKey,
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user })
    }
  )
);

export function useBootstrapAuth() {
  const ready = useAuthStore((s) => s.ready);
  const setReady = useAuthStore((s) => s.setReady);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const base = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${base}/api/auth/refresh`, {
          method: "POST",
          credentials: "include"
        });

        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSession({ accessToken: data.accessToken, user: data.user });
        } else {
          // If there's no valid refresh cookie, keep persisted token (if any) but it might be expired.
          // If user is missing, clear.
          const state = useAuthStore.getState();
          if (!state.user) clear();
        }
      } catch (e) {
        // offline or API down: keep persisted session
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [setReady, setSession, clear]);

  return { ready };
}
