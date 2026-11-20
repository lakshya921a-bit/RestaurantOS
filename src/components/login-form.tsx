"use client";

import { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, ChefHat } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("owner@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Login failed");
      window.location.href = "/";
    } catch (x) {
      setError(x instanceof Error ? x.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function setDemoCredentials() {
    setEmail("owner@example.com");
    setPassword("ChangeMe123!");
  }

  return (
    <div className="w-full max-w-md bg-[#131720]/90 border border-[#232a36] backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Subtle decorative glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#131720] rounded-[14px] flex items-center justify-center text-amber-400">
            <ChefHat size={26} />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            restaurant<span className="text-amber-400">OS</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Enterprise Dining & POS Platform</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-100">Welcome to Workspace</h2>
        <p className="text-xs text-slate-400 mt-1">Sign in to manage tables, POS orders, kitchen tickets and analytics.</p>
      </div>

      {/* Demo helper banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 mb-6 flex items-start justify-between gap-3 text-xs">
        <div>
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Sparkles size={14} /> One-Click Demo Mode Ready
          </div>
          <div className="text-slate-300 mt-1 text-[11px]">
            Prefilled with <span className="text-amber-200 font-mono">owner@example.com</span>
          </div>
        </div>
        <button
          type="button"
          onClick={setDemoCredentials}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] tracking-wide uppercase px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Autofill
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
            Staff Work Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail size={16} />
            </div>
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="owner@example.com"
              className="w-full bg-[#0d1017] border border-[#262f3d] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none transition"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Security Key / Password
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock size={16} />
            </div>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#0d1017] border border-[#262f3d] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none transition"
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl p-3">
            {error}
          </div>
        )}

        <button
          disabled={busy}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl py-3.5 px-4 text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
        >
          {busy ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Launch RestaurantOS</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#1e2531] flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-400" /> End-to-end Encrypted
        </span>
        <span className="font-mono text-slate-500">v1.2.0 • Offline SQLite</span>
      </div>
    </div>
  );
}
