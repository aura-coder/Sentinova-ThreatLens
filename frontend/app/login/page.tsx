"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveToken } from "../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.set("username", email);
      body.set("password", password);

      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) {
        setError("Incorrect email or password");
        setLoading(false);
        return;
      }

      const data = await res.json();
      saveToken(data.access_token);
      router.push("/");
    } catch {
      setError("Could not reach the server");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050608]">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[500px] w-[500px] rounded-full bg-amber-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/[0.15] [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] shadow-inner backdrop-blur-md">
            <span className="text-lg font-semibold text-amber-400">TL</span>
          </div>
          <h1 className="text-lg font-medium tracking-tight text-white">
            Sign in to ThreatLens
          </h1>
          <p className="mt-1 text-xs text-white/40">Cyber Threat Intelligence Platform</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300 backdrop-blur-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-md transition focus:border-amber-400/40 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-md transition focus:border-amber-400/40 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl border border-amber-400/20 bg-gradient-to-b from-amber-400/90 to-amber-500/90 py-2.5 text-sm font-medium text-black shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-6 text-center text-[11px] text-white/30">
          Accounts are provisioned by an administrator.
        </p>
      </form>
    </div>
  );
}