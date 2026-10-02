"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, ShieldAlert, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { ADMIN_CONFIG, loginAdmin, getAdminSession } from "../lib/auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Auto-redirect if already logged in as admin
  useEffect(() => {
    const { token } = getAdminSession();
    if (token) {
      window.location.href = "/dashboard";
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const result = await loginAdmin(email, password);
      setSuccessMessage(`Welcome back, ${result.first_name || "Administrator"}. Redirecting to Power Admin Dashboard...`);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid administrator credentials or unauthorized account role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[#07090e]">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src={ADMIN_CONFIG.backgroundImagePath}
          alt="ChronoBid Admin Portal Background"
          fill
          priority
          className="object-cover object-center filter brightness-[0.42] contrast-[1.1]"
        />
        {/* Subtle Dark Vignette & Gold Ray Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-[#07090e]/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
      </div>

      {/* Main Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-8 md:p-10 border border-amber-500/30 shadow-2xl backdrop-blur-xl bg-[#0a0d14]/85">
        
        {/* ChronoBid Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-400/20 to-amber-600/10 border border-amber-500/40 mb-4 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-9 h-9 text-amber-400" />
          </div>
          
          <h1 className="text-3xl font-serif tracking-tight font-bold gold-gradient-text">
            ChronoBid
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-300/70 font-medium mt-1">
            Bid. Win. Own History.
          </p>

          <div className="my-6 border-t border-amber-500/15 relative">
            <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-[#0c1018] px-3 text-[11px] uppercase tracking-widest text-amber-400/80 border border-amber-500/20 rounded-full">
              Admin Access
            </span>
          </div>

          <p className="text-xs text-slate-300 font-light">
            Secure login for authorized administrators only.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Administrator Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Address Field */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-300 font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your admin email"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-amber-500/25 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-300 font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-amber-500/25 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-400 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between pt-1 pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-amber-500/40 bg-slate-950 text-amber-500 focus:ring-amber-500/30 accent-amber-500"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 gold-gradient-btn cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-4 shadow-lg shadow-amber-500/20"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Authenticating Administrator...
              </span>
            ) : (
              <>
                <span>Login to Admin Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Restricted Access Security Notice */}
        <div className="mt-8 pt-5 border-t border-slate-800/80 text-center">
          <div className="inline-flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Restricted Access</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            Only authorized administrators can access this system. All activities are monitored and logged.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-amber-500/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-amber-300">Admin Password Reset</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              For security compliance, administrator password resets require super-admin clearance or console secret token access.
            </p>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
              Contact: security@chronobid.com
            </div>
            <button
              onClick={() => setForgotModalOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
