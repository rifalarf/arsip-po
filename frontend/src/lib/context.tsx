"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/lib/types";
import { supabase } from "@/lib/supabase";

// ---- Context shape (auth only) ----
interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AuthState | undefined>(undefined);

/** Fetch user profile from `users` table by Supabase Auth UID */
async function fetchProfile(authId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return data as User;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount — rely solely on onAuthStateChange (fires INITIAL_SESSION on subscribe)
  useEffect(() => {
    let initialised = false;

    // Safety timeout: if Supabase never responds (unreachable, DNS failure, etc.),
    // force loading to stop so the user isn't stuck on a spinner forever.
    const timeout = setTimeout(() => {
      if (!initialised) {
        console.warn(
          "[AppProvider] Auth initialisation timed out after 5 s — treating user as unauthenticated.",
        );
        initialised = true;
        setLoading(false);
      }
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("[AppProvider] Failed to fetch user profile:", err);
        setUser(null);
      }
      // Only flip loading off once (on the first event — INITIAL_SESSION)
      if (!initialised) {
        initialised = true;
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    // 1. Lookup email by username
    const { data: userRow, error: lookupError } = await supabase
      .from("users")
      .select("email")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (lookupError || !userRow) {
      throw new Error("Username tidak ditemukan");
    }

    // 2. Authenticate with Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userRow.email,
      password,
    });

    if (authError) {
      throw new Error("Username atau password salah");
    }

    // Profile will be set via onAuthStateChange listener
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AppContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
