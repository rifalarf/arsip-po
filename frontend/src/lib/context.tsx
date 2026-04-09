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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

  // Restore session on mount — rely solely on onAuthStateChange (fires INITIAL_SESSION on subscribe)
  useEffect(() => {
    let initialised = false;
    let currentRequestId = 0; // Guard against stale async responses

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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug("[AppProvider] Auth event:", event, session?.user?.id);

      // Skip TOKEN_REFRESHED if we already have a user. 
      // Also skip events that happen BEFORE initialisation completes if it is just a refresh.
      if (event === "TOKEN_REFRESHED" && user) {
        return;
      }

      if (event === "SIGNED_OUT") {
        queryClient.clear();
        setUser(null);
        if (initialised) {
          toast.info("Sesi login Anda telah berakhir. Silakan masuk kembali.");
        }
      }

      const requestId = ++currentRequestId;

      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (requestId === currentRequestId) {
            setUser(profile);
            if (!profile) {
              console.warn("[AppProvider] Auth session exists but profile not found for UID:", session.user.id);
              // Handle edge case where auth session exists but no matched profile in 'users' table
              if (event === "INITIAL_SESSION") {
                 // Might want to sign out or just stay unauthenticated
              }
            }
          }
        } else {
          if (requestId === currentRequestId) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error("[AppProvider] Auth error:", err);
      } finally {
        // Only set loading to false AFTER trying to fetch the profile
        if (requestId === currentRequestId) {
          if (!initialised) {
            initialised = true;
            setLoading(false);
            clearTimeout(timeout);
          }
        }
      }
    });
queryClient
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
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userRow.email,
      password,
    });

    if (authError) {
      throw new Error("Username atau password salah");
    }

    // 3. Immediately fetch and set profile to avoid race condition
    //    onAuthStateChange will also fire, but we set the user here first
    //    so the dashboard layout doesn't see user=null and redirect to login.
    if (authData.user) {
      const profile = await fetchProfile(authData.user.id);
      setUser(profile);
    }
  }, []);

  const logout = useCallback(async () => {
    queryClient.clear();
    await supabase.auth.signOut();
    setUser(null);
  }, [queryClient]);

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
