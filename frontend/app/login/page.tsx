"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, Eye, EyeOff } from "lucide-react";

const roleMap: Record<string, string> = {
  "Analyst": "/dashboard/analyst",
  "Executive": "/dashboard/executive",
  "Incident Response": "/dashboard/incident-responder",
  "Indicators": "/indicators",
  "Threat Hunting": "/dashboard/threat-hunting",
  "Threat Feeds": "/threat-feeds",
  "Audit Logs": "/audit-logs",
};

export default function LoginPage() {
  const [email, setEmail] = useState("admin@threatlens.local");
  const [password, setPassword] = useState("Admin@123");
  const [selectedRole, setSelectedRole] = useState("Analyst");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!res.ok) throw new Error("Invalid credentials.");
      const data = await res.json();

      if (data.access_token) {
        localStorage.setItem("threatlens_token", data.access_token);
        document.cookie = "token=" + data.access_token + "; path=/";
        router.push(roleMap[selectedRole] || "/dashboard/analyst");
      } else {
        throw new Error("Invalid token received");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid bg-[#0a0a0a] relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#38bdf8]/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-md p-10 bg-[#121212]/80 backdrop-blur-xl border border-[#30363d] rounded-2xl shadow-2xl relative z-10">
        
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#38bdf8]/10 border-2 border-[#38bdf8]/40 flex items-center justify-center shadow-lg shadow-[#38bdf8]/20">
            <ShieldCheck className="text-[#38bdf8]" size={32} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            THREAT<span className="text-[#38bdf8]">LENS</span>
          </h1>
          <p className="text-sm text-[#8b949e] mt-2">Security Operations Center · Enterprise Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0a0a0a] border border-[#30363d] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6a7a] focus:outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 transition-all"
                placeholder="admin@threatlens.local"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0a0a0a] border border-[#30363d] rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder-[#5a6a7a] focus:outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">Dashboard</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#30363d] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 transition-all appearance-none"
            >
              {Object.keys(roleMap).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-[#f83b4f] text-xs text-center font-bold bg-[#f83b4f]/10 border border-[#f83b4f]/30 rounded-lg py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#38bdf8] hover:bg-[#2eaadc] text-[#0a0a0a] font-bold text-sm py-3.5 uppercase tracking-wider rounded-lg shadow-lg shadow-[#38bdf8]/20 transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#30363d] pt-6">
          <p className="text-xs text-[#5a6a7a]">Accounts are provisioned by SOC Administrator.</p>
        </div>
      </div>
    </div>
  );
}
