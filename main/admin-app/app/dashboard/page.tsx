"use client";

import React, { useEffect, useState } from "react";
import { getAdminSession, logoutAdmin, AdminUser } from "../../lib/auth";
import {
  Users,
  Gavel,
  DollarSign,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Settings,
  Search,
  Bell,
  LogOut,
  ArrowRight,
  Cpu,
  Coins,
  TrendingUp,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  RefreshCw,
  Percent,
  ChevronRight
} from "lucide-react";

export default function PowerAdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const { token, user: sessionUser } = getAdminSession();
    if (!token || !sessionUser) {
      window.location.href = "/";
    } else {
      setUser(sessionUser);
      setAuthorized(true);
    }

    // Format current date and time
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        day: "02",
        month: "short",
        year: "numeric"
      };
      setCurrentDate(now.toLocaleDateString("en-US", options));
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6 text-amber-400 font-mono text-sm">
        Verifying Administrator Authorization...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 flex flex-col md:flex-row font-sans antialiased">
      {/* ─── 1. MINIMAL SIDEBAR (Dark Navy) ─── */}
      <aside className="w-full md:w-64 bg-[#0b0f19] text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        {/* ChronoBid Branding */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-amber-400/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Gavel className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-white tracking-tight">
                ChronoBid
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80 font-medium">
                Bid. Win. Own History.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 p-4 space-y-6 text-xs overflow-y-auto">
          {/* OVERVIEW */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-300/80">
              Overview
            </p>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-amber-500/15 border-l-4 border-amber-400 text-amber-400 font-semibold shadow-xs"
                  : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* MANAGEMENT */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-300/80">
              Management
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === "users"
                    ? "bg-amber-500/15 border-l-4 border-amber-400 text-amber-400 font-semibold"
                    : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Users</span>
              </button>

              <button
                onClick={() => setActiveTab("item-approval")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === "item-approval"
                    ? "bg-amber-500/15 border-l-4 border-amber-400 text-amber-400 font-semibold"
                    : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Item Approval</span>
              </button>

              <button
                onClick={() => setActiveTab("auctions")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === "auctions"
                    ? "bg-amber-500/15 border-l-4 border-amber-400 text-amber-400 font-semibold"
                    : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Gavel className="w-4 h-4" />
                <span>Auctions</span>
              </button>
            </div>
          </div>

          {/* SECURITY */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-300/80">
              Security
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("ai-verification")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === "ai-verification"
                    ? "bg-amber-500/15 border-l-4 border-amber-400 text-amber-400 font-semibold"
                    : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>AI Verification</span>
              </button>

              <button
                onClick={() => setActiveTab("fraud-risk")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === "fraud-risk"
                    ? "bg-amber-500/15 border-l-4 border-amber-400 text-amber-400 font-semibold"
                    : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Fraud & Risk</span>
              </button>
            </div>
          </div>

          {/* FINANCE */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-300/80">
              Finance
            </p>
            <button
              onClick={() => setActiveTab("finance")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === "finance"
                  ? "bg-amber-500/15 border-l-4 border-amber-400 text-amber-400 font-semibold"
                  : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Finance & Escrow</span>
            </button>
          </div>

          {/* SYSTEM */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-300/80">
              System
            </p>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-amber-500/15 border-l-4 border-amber-400 text-amber-400 font-semibold"
                  : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* ─── 2. DASHBOARD HEADER ─── */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search users, auctions, items, or IDs..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>

          {/* User & Notifications Right Controls */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center border-2 border-white">
                3
              </span>
            </button>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-800 font-bold text-xs flex items-center justify-center">
                SA
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-900 leading-none">
                  {user?.first_name || "Super"} {user?.last_name || "Admin"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                  {user?.role || "Super Admin"}
                </p>
              </div>
            </div>

            <button
              onClick={logoutAdmin}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Title Row + Realtime Clock */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                Power Admin Dashboard
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Monitor ChronoBid operations, approvals, auctions, finance and platform security.
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 font-medium">
              <p className="font-semibold text-slate-700">{currentDate}</p>
              <p className="text-base font-serif font-bold text-amber-600">{currentTime}</p>
            </div>
          </div>

          {/* ─── 3. TOP 5 KPI CARDS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Users */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Users</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-serif font-bold text-slate-900">12,482</p>
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
                  <span>↑ 8.4%</span>
                  <span className="text-slate-400 font-normal">this month</span>
                </p>
              </div>
            </div>

            {/* Card 2: Active Auctions */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Auctions</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Gavel className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-serif font-bold text-slate-900">248</p>
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-500 font-normal">Currently live</span>
                </p>
              </div>
            </div>

            {/* Card 3: Platform Revenue */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Platform Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-serif font-bold text-slate-900">$128,450</p>
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
                  <span>↑ 18%</span>
                  <span className="text-slate-400 font-normal">this month</span>
                </p>
              </div>
            </div>

            {/* Card 4: Escrow Locked */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Escrow Locked</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-serif font-bold text-slate-900">$84,620</p>
                <p className="text-[11px] text-slate-400 font-normal mt-1">
                  Funds currently secured
                </p>
              </div>
            </div>

            {/* Card 5: Pending Approvals */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-serif font-bold text-slate-900">27</p>
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-rose-600 font-medium">Requires admin review</span>
                </p>
              </div>
            </div>
          </div>

          {/* ─── 4. ITEM APPROVAL TABLE & 5. AUCTION OVERVIEW (ROW 2) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Item Approval (Takes 2 Columns) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-serif font-bold text-slate-900">Item Approval</h3>
                      <p className="text-xs text-slate-400">Items waiting for verification and admin approval</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer">
                    <span>View All Items</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Compact Item Approval Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">Seller</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">AI Confidence</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Submitted</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Row 1 */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                          <img
                            src="/images/admin-login-background.jpg"
                            alt="Vintage Rolex"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <span>Vintage Rolex</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">John Smith</td>
                        <td className="py-3 px-3 text-slate-500">Timepieces</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>94%</span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="w-[94%] h-full bg-emerald-500 rounded-full" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            AI Verified
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">2h ago</td>
                        <td className="py-3 px-3 text-right">
                          <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 ml-auto cursor-pointer">
                            <span>Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>

                      {/* Row 2 */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                          <img
                            src="/images/admin-login-background.jpg"
                            alt="Antique Vase"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <span>Antique Vase</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">Michael Lee</td>
                        <td className="py-3 px-3 text-slate-500">Ceramics</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>62%</span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="w-[62%] h-full bg-amber-500 rounded-full" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                            Needs Review
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">4h ago</td>
                        <td className="py-3 px-3 text-right">
                          <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 ml-auto cursor-pointer">
                            <span>Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>

                      {/* Row 3 */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                          <img
                            src="/images/admin-login-background.jpg"
                            alt="Rare Painting"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <span>Rare Painting</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">David Kumar</td>
                        <td className="py-3 px-3 text-slate-500">Paintings</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>48%</span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="w-[48%] h-full bg-rose-500 rounded-full" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                            Manual Review
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">6h ago</td>
                        <td className="py-3 px-3 text-right">
                          <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 ml-auto cursor-pointer">
                            <span>Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>

                      {/* Row 4 */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                          <img
                            src="/images/admin-login-background.jpg"
                            alt="Classic Mercedes"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <span>Classic Mercedes</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">Sophia Chen</td>
                        <td className="py-3 px-3 text-slate-500">Automobiles</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>88%</span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="w-[88%] h-full bg-emerald-500 rounded-full" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            AI Verified
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">8h ago</td>
                        <td className="py-3 px-3 text-right">
                          <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 ml-auto cursor-pointer">
                            <span>Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5. Auction Overview Card (1 Column) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Gavel className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-base font-serif font-bold text-slate-900">Auction Overview</h3>
                  </div>
                  <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer">
                    View All →
                  </button>
                </div>

                {/* 4 Summary Counters Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Live Auctions</span>
                    </div>
                    <p className="text-2xl font-serif font-bold text-slate-900 mt-1">248</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Ending Today</span>
                    </div>
                    <p className="text-2xl font-serif font-bold text-slate-900 mt-1">18</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Pending Approval</span>
                    </div>
                    <p className="text-2xl font-serif font-bold text-slate-900 mt-1">12</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Completed</span>
                    </div>
                    <p className="text-2xl font-serif font-bold text-slate-900 mt-1">86</p>
                  </div>
                </div>

                {/* Status Progress Bars */}
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between font-medium text-slate-600 mb-1">
                      <span>Live Auctions</span>
                      <span className="font-semibold text-slate-900">248 <span className="text-slate-400 font-normal">(48%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[48%] h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-600 mb-1">
                      <span>Ending Today</span>
                      <span className="font-semibold text-slate-900">18 <span className="text-slate-400 font-normal">(7%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[7%] h-full bg-amber-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-600 mb-1">
                      <span>Pending Approval</span>
                      <span className="font-semibold text-slate-900">12 <span className="text-slate-400 font-normal">(5%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[5%] h-full bg-blue-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-600 mb-1">
                      <span>Completed</span>
                      <span className="font-semibold text-slate-900">86 <span className="text-slate-400 font-normal">(40%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[40%] h-full bg-purple-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 6. FRAUD ALERTS, 7. FINANCE & ESCROW, 8. AI VERIFICATION (ROW 3) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 6. Fraud & Risk Alerts Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <ShieldAlert className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-base font-serif font-bold text-slate-900">Fraud & Risk Alerts</h3>
                  </div>
                  <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer">
                    View Fraud Center →
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Alert 1 */}
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 flex items-start justify-between gap-2">
                    <div className="flex gap-2.5">
                      <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-[10px] font-bold rounded-md uppercase">High</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Suspicious bidding pattern</p>
                        <p className="text-[11px] text-slate-500">User #4928 • Rapid bidding detected</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400">2h ago</span>
                      <button className="block text-[11px] font-semibold text-amber-600 hover:text-amber-700 mt-1 cursor-pointer">
                        Review →
                      </button>
                    </div>
                  </div>

                  {/* Alert 2 */}
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-start justify-between gap-2">
                    <div className="flex gap-2.5">
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-md uppercase">Medium</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Duplicate identity detected</p>
                        <p className="text-[11px] text-slate-500">User #3812 • Multiple identity documents</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400">5h ago</span>
                      <button className="block text-[11px] font-semibold text-amber-600 hover:text-amber-700 mt-1 cursor-pointer">
                        Review →
                      </button>
                    </div>
                  </div>

                  {/* Alert 3 */}
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 flex items-start justify-between gap-2">
                    <div className="flex gap-2.5">
                      <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-[10px] font-bold rounded-md uppercase">High</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Seller self-bidding alert</p>
                        <p className="text-[11px] text-slate-500">Auction #A1042 • Possible seller/bidder relationship</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400">8h ago</span>
                      <button className="block text-[11px] font-semibold text-amber-600 hover:text-amber-700 mt-1 cursor-pointer">
                        Review →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Finance & Escrow Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Coins className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-base font-serif font-bold text-slate-900">Finance & Escrow</h3>
                  </div>
                  <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer">
                    Manage Finance →
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <span className="text-slate-600 font-medium">Escrow Locked</span>
                    </div>
                    <span className="text-sm font-serif font-bold text-slate-900">$84,620</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-slate-600 font-medium">Pending Payouts</span>
                    </div>
                    <span className="text-sm font-serif font-bold text-slate-900">$21,450</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-600 font-medium">Released This Month</span>
                    </div>
                    <span className="text-sm font-serif font-bold text-slate-900">$67,800</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Percent className="w-4 h-4 text-purple-600" />
                      <span className="text-slate-600 font-medium">Platform Fees</span>
                    </div>
                    <span className="text-sm font-serif font-bold text-slate-900">$6,420</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. AI Verification Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Cpu className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-base font-serif font-bold text-slate-900">AI Verification</h3>
                  </div>
                  <button className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer">
                    Open AI Verification →
                  </button>
                </div>

                <div className="space-y-3 text-xs mb-4">
                  <div>
                    <div className="flex justify-between font-medium text-slate-600 mb-1">
                      <span>Verified</span>
                      <span className="font-semibold text-slate-900">186 <span className="text-slate-400 font-normal">(76%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[76%] h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-600 mb-1">
                      <span>Needs Manual Review</span>
                      <span className="font-semibold text-slate-900">27 <span className="text-slate-400 font-normal">(11%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[11%] h-full bg-amber-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-600 mb-1">
                      <span>Rejected</span>
                      <span className="font-semibold text-slate-900">14 <span className="text-slate-400 font-normal">(6%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[6%] h-full bg-rose-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">AI Verification Accuracy</p>
                      <p className="text-[10px] text-slate-500">Based on latest 500 items</p>
                    </div>
                  </div>
                  <span className="text-lg font-serif font-bold text-emerald-700">92%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 9. QUICK ADMIN ACTIONS (ROW 4) ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4.5 h-4.5 text-amber-500" />
              <h3 className="text-base font-serif font-bold text-slate-900">Quick Admin Actions</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {/* Action 1 */}
              <button
                onClick={() => setActiveTab("item-approval")}
                className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-amber-950 group-hover:text-amber-900">Review Items</p>
                  <p className="text-[11px] text-amber-700/80 mt-0.5">Items waiting for approval</p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 2 */}
              <button
                onClick={() => setActiveTab("fraud-risk")}
                className="p-4 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-rose-950 group-hover:text-rose-900">Review Fraud Alerts</p>
                  <p className="text-[11px] text-rose-700/80 mt-0.5">Check suspicious activities</p>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 3 */}
              <button
                onClick={() => setActiveTab("auctions")}
                className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-blue-950 group-hover:text-blue-900">Manage Auctions</p>
                  <p className="text-[11px] text-blue-700/80 mt-0.5">View and manage auctions</p>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 4 */}
              <button
                onClick={() => setActiveTab("finance")}
                className="p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-emerald-950 group-hover:text-emerald-900">View Finance</p>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">Escrow, payouts and revenue</p>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
