"use client";

import React, { useEffect, useState } from "react";
import { getAdminSession, logoutAdmin, AdminUser } from "../../lib/auth";
import { ShieldCheck, LogOut, LayoutDashboard, Users, Gavel, CheckCircle, ShieldAlert, Settings, AlertTriangle } from "lucide-react";

export default function PowerAdminDashboardPlaceholder() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const { token, user: sessionUser } = getAdminSession();
    if (!token || !sessionUser) {
      window.location.href = "/";
    } else {
      setUser(sessionUser);
      setAuthorized(true);
    }
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-6 text-amber-400 font-mono text-sm">
        Verifying Administrator Authorization...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Power Admin Header */}
      <header className="border-b border-amber-500/20 bg-[#0a0d14]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold gold-gradient-text">ChronoBid Power Admin</h1>
            <p className="text-[11px] text-slate-400">Port 3001 • Authorized Administrator Session</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] text-amber-400 uppercase font-mono">{user?.role || "SUPER_ADMIN"}</p>
          </div>

          <button
            onClick={logoutAdmin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body Placeholder */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full flex flex-col justify-center items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl shadow-amber-500/10">
          <LayoutDashboard className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono mb-4">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Administrator Authenticated Successfully</span>
        </div>

        <h2 className="text-3xl font-serif font-bold text-amber-200 mb-3">
          Power Admin Application Gateway
        </h2>
        <p className="text-sm text-slate-300 max-w-lg mb-8 leading-relaxed">
          You are logged in to the dedicated Power Admin application on <code className="text-amber-400 font-mono">http://localhost:3001</code>.
          The administrator login and authentication foundation is fully active.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <div className="p-5 rounded-2xl glass-panel border border-amber-500/20 text-left">
            <Users className="w-6 h-6 text-amber-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">Users & KYC</h3>
            <p className="text-xs text-slate-400 mt-1">Ready for next design step</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-amber-500/20 text-left">
            <Gavel className="w-6 h-6 text-amber-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">Auctions & Moderation</h3>
            <p className="text-xs text-slate-400 mt-1">Ready for next design step</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-amber-500/20 text-left">
            <Settings className="w-6 h-6 text-amber-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">System & Finance</h3>
            <p className="text-xs text-slate-400 mt-1">Ready for next design step</p>
          </div>
        </div>
      </main>
    </div>
  );
}
