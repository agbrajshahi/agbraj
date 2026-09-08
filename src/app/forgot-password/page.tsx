"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process request");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl w-full mx-auto">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white tracking-tight">Forgot Password</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your registered email address to receive password reset instructions
          </p>

          {result ? (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Reset Token Generated
              </div>
              <p>{result.message}</p>
              {result.resetUrl && (
                <div className="pt-2 border-t border-emerald-500/20">
                  <span className="text-[10px] text-slate-400 block mb-1">Development Fast Reset Link:</span>
                  <Link
                    href={result.resetUrl}
                    className="inline-block px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 transition text-[11px]"
                  >
                    Proceed to Reset Password →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/30">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@abacusup.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        &copy; 2026 ABACUSUP Platform
      </div>
    </div>
  );
}
