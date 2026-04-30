"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabase = supabaseUrl && supabaseUrl !== "https://placeholder.supabase.co";

    if (!hasSupabase) {
      // No Supabase configured — allow demo login
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 600);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        setError("Check your email to confirm your account.");
        setLoading(false);
        return;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        router.push("/dashboard");
      }
    } catch {
      setError("Authentication error. Check your Supabase configuration.");
      setLoading(false);
    }
  }

  function handleDemo() {
    setDemoMode(true);
    setTimeout(() => router.push("/dashboard"), 400);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">TradeTrack</span>
          </div>
          <p className="text-[#9090a8] text-sm">Professional trading journal &amp; analytics</p>
        </div>

        {/* Card */}
        <div className="bg-[#131316] border border-[#2a2a35] rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex rounded-lg bg-[#0d0d0f] p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === m
                    ? "bg-[#1a1a1f] text-white shadow"
                    : "text-[#9090a8] hover:text-[#e8e8f0]"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9090a8] mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#0d0d0f] border border-[#2a2a35] rounded-lg px-3 py-2.5 text-sm text-[#e8e8f0] placeholder:text-[#55556a] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9090a8] mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0d0d0f] border border-[#2a2a35] rounded-lg px-3 py-2.5 pr-10 text-sm text-[#e8e8f0] placeholder:text-[#55556a] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55556a] hover:text-[#9090a8]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-[#ef4444] bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? "Signing in..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2a2a35]" />
            <span className="text-xs text-[#55556a]">or</span>
            <div className="flex-1 h-px bg-[#2a2a35]" />
          </div>

          <button
            onClick={handleDemo}
            disabled={demoMode}
            className="mt-4 w-full bg-[#1a1a1f] hover:bg-[#1f1f26] border border-[#2a2a35] text-[#9090a8] hover:text-[#e8e8f0] font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {demoMode ? "Loading demo..." : "Continue with Demo Data"}
          </button>
        </div>

        <p className="text-center text-xs text-[#55556a] mt-4">
          Add your Supabase credentials in <code className="text-[#9090a8]">.env.local</code> to enable auth
        </p>
      </div>
    </div>
  );
}
