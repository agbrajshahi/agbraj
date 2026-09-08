"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  Info,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@abacusup.com");
  const [password, setPassword] = useState("AbacusUp@2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      const role = data.user?.role;
      if (role === "STUDENT") {
        router.push("/student");
      } else if (role === "TEACHER") {
        router.push("/teacher");
      } else if (role === "PARENT") {
        router.push("/parent");
      } else if (role === "ACCOUNTANT") {
        router.push("/accountant");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (e: string) => {
    setEmail(e);
    setPassword("AbacusUp@2026!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Branding */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
            A
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              ABACUS<span className="text-blue-400">UP</span>
            </span>
            <span className="text-[10px] tracking-wider font-semibold text-slate-400 uppercase block -mt-1">
              Education Management Platform
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          ← Return to Public Website
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5" /> Phase 1 Secure Access
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Sign In to EMS Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Access your institutional dashboard, batch timetables, and student profiles
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@abacusup.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In to AbacusUp <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Fast Demo Login Presets (Phase 1 Seed):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillQuickAccount("superadmin@abacusup.com")}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg text-left text-slate-300 hover:text-white transition"
              >
                <strong className="block text-blue-400">Super Admin</strong>
                <span className="text-[10px] text-slate-500 truncate block">superadmin@abacusup.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("admin@abacusup.com")}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg text-left text-slate-300 hover:text-white transition"
              >
                <strong className="block text-indigo-400">Admin</strong>
                <span className="text-[10px] text-slate-500 truncate block">admin@abacusup.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("manager.downtown@abacusup.com")}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg text-left text-slate-300 hover:text-white transition"
              >
                <strong className="block text-emerald-400">Branch Manager</strong>
                <span className="text-[10px] text-slate-500 truncate block">manager.downtown@...</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("sarah.lin@abacusup.com")}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg text-left text-slate-300 hover:text-white transition"
              >
                <strong className="block text-teal-400">Teacher</strong>
                <span className="text-[10px] text-slate-500 truncate block">sarah.lin@...</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("liam.anderson.portal@abacusup.com")}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg text-left text-slate-300 hover:text-white transition"
              >
                <strong className="block text-sky-400">Student Portal</strong>
                <span className="text-[10px] text-slate-500 truncate block">liam.anderson.portal@...</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("robert.anderson@example.com")}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg text-left text-slate-300 hover:text-white transition"
              >
                <strong className="block text-rose-400">Parent Portal</strong>
                <span className="text-[10px] text-slate-500 truncate block">robert.anderson@...</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("accountant@abacusup.com")}
                className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-lg text-left text-slate-300 hover:text-white transition"
              >
                <strong className="block text-amber-400">Accountant</strong>
                <span className="text-[10px] text-slate-500 truncate block">accountant@abacusup.com</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Seed Password: <span className="font-mono text-slate-300">AbacusUp@2026!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500">
        &copy; 2026 ABACUSUP Platform • Phase 1 Foundation & Core Education Management System
      </div>
    </div>
  );
}
