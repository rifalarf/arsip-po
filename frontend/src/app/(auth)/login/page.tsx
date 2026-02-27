"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login, loading: authLoading, user } = useApp();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  // While checking session or already logged in, don't show the form
  if (authLoading || user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(username.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — desktop only */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(150deg, hsl(158,52%,11%) 0%, hsl(152,45%,15%) 55%, hsl(145,40%,20%) 100%)",
        }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.6) 40px,rgba(255,255,255,0.6) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.6) 40px,rgba(255,255,255,0.6) 41px)",
          }}
        />
        {/* Decorative circle */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10 bg-emerald-400" />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.07] bg-emerald-300" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 border border-white/15">
            <Archive className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Arsip PO
          </span>
        </div>

        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold text-white leading-snug">
            Sistem Arsip
            <br />
            Purchase Order
          </h2>
          <p className="text-white/55 leading-relaxed">
            Pengelolaan arsip dokumen PO Departemen Pengadaan secara digital,
            terstruktur, dan mudah ditelusuri.
          </p>
        </div>

        <p className="relative text-xs text-white/30 font-medium">
          Departemen Pengadaan Barang dan Jasa
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Archive className="h-7 w-7 text-primary" aria-hidden="true" />
              <h1 className="text-xl font-bold tracking-tight">Arsip PO</h1>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Sistem Arsip PO — Pengadaan Barang dan Jasa
            </p>
          </div>

          {/* Login form */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Masuk</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan username dan password untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan username…"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                autoComplete="username"
                spellCheck={false}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password…"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="current-password"
                required
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={submitting || !username.trim() || !password}
            >
              {submitting ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Masuk…
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
