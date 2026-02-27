import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // store session in localStorage → survives reload/close
    autoRefreshToken: true, // silently refresh access token before it expires
    detectSessionInUrl: false, // not using OAuth redirects
    storageKey: "arsip-po-auth",
  },
});
