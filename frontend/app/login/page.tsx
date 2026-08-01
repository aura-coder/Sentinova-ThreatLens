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
      <div className="pointer-events-none absolute -top-40 -left-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />

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
        className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-secondary/40 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-primary/30 bg-primary/10 shadow-inner">
            <span className="text-lg font-semibold text-primary">TL</span>
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
              className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md border border-primary/30 bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
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