"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Archive, Database, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const { login, loading: authLoading, user } = useApp();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Header / Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Database className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ProcureHub</h1>
        </div>

        {/* Login form */}
        <Card className="border-slate-200/60 shadow-sm bg-white rounded-xl">
          <CardHeader className="space-y-2 pb-6 pt-8 text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">Selamat Datang</CardTitle>
            <p className="text-sm text-slate-500">
              Masukkan kredensial untuk mengakses akun Anda
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="username" className="text-sm font-medium text-slate-900">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  autoComplete="username"
                  spellCheck={false}
                  required
                  className="bg-[#f0f4f8] border-0 h-11 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:bg-white focus-visible:border-slate-300 transition-colors"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-900">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    autoComplete="current-password"
                    required
                    className="bg-[#f0f4f8] border-0 h-11 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:bg-white focus-visible:border-slate-300 transition-colors pr-10 tracking-widest font-medium"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="rounded-sm border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900"
                  >
                    Ingat saya
                  </label>
                </div>
                <button type="button" className="text-sm font-medium text-slate-900 hover:underline">
                  Lupa password?
                </button>
              </div>

              {error && (
                <p
                  className="text-sm text-red-500 font-medium pt-1"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-[#1a1a1a] hover:bg-black text-white rounded-md mt-2 font-medium"
                disabled={submitting || !username.trim() || !password}
              >
                {submitting ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Masuk
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500">
          Belum punya akun? <button type="button" className="font-semibold text-slate-900 hover:underline">Hubungi Support</button>
        </p>
      </div>
    </div>
  );
}
