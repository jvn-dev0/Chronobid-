"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Users,
  Gavel,
  CheckCircle,
  ShieldAlert,
  Settings,
  Search,
  Bell,
  Clock,
  DollarSign,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Eye,
  Check,
  X,
  RefreshCw,
  Sliders,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { getAdminSession, logoutAdmin, AdminUser, ADMIN_CONFIG } from "../../lib/auth";

interface DashboardData {
  kpis: {
    total_users: number;
    active_auctions: number;
    platform_revenue: number;
    escrow_locked: number;
    pending_approvals: number;
  };
  item_approvals: Array<{
    id: number;
    title: str;
    image_url: str;
    seller: str;
    category: str;
    ai_confidence: number;
    status: str;
    submitted: str;
    reserve_price: number;
  }>;
  auction_overview: {
    live: number;
    ending_today: number;
    pending_approval: number;
    completed: number;
  };
  fraud_alerts: Array<{
    id: number;
    severity: str;
    title: str;
    subtitle: str;
    time: str;
    reason: str;
  }>;
  finance: {
    escrow_locked: number;
    pending_payouts: number;
    released_this_month: number;
    platform_fees: number;
  };
  ai_verification: {
    verified: number;
    needs_manual_review: number;
    rejected: number;
    accuracy: number;
  };
}

export default function PowerAdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [reviewModalAuction, setReviewModalAuction] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch 100% database-driven metrics from FastAPI backend
  const fetchDashboardMetrics = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { token } = getAdminSession();
      if (!token) {
        window.location.href = "/";
        return;
      }

      const res = await fetch(`${ADMIN_CONFIG.apiBaseUrl}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        logoutAdmin();
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load live database metrics.");
      }

      const data = await res.json();
      setDashboardData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Error connecting to database server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { token, user: sessionUser } = getAdminSession();
    if (!token || !sessionUser) {
      window.location.href = "/";
    } else {
      setUser(sessionUser);
      setAuthorized(true);
      fetchDashboardMetrics();
    }
  }, []);

  // Handle Auction Approval / Rejection Action
  const handleAuctionAction = async (auctionId: number, action: "approve" | "reject") => {
    setActionLoading(true);
    try {
      const { token } = getAdminSession();
      const res = await fetch(`${ADMIN_CONFIG.apiBaseUrl}/api/admin/approve-auction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auction_id: auctionId,
          action: action,
          comments: `Admin ${action === "approve" ? "approved" : "rejected"} lot #${auctionId}`,
        }),
      });

      if (!res.ok) {
        throw new Error("Action failed");
      }

      setReviewModalAuction(null);
      // Re-fetch live metrics from database so dashboard updates instantly
      await fetchDashboardMetrics();
    } catch (err: any) {
      alert("Failed to update auction state in database.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-6 text-amber-400 font-mono text-xs">
        Authenticating Administrator Session...
      </div>
    );
  }

  const initials = user ? `${user.first_name?.[0] || "S"}${user.last_name?.[0] || "A"}` : "SA";
  const fullName = user ? `${user.first_name} ${user.last_name}` : "Super Admin";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row">
      {/* ─── 1. Minimal Power Admin Sidebar (Dark Navy #0B0F19) ─── */}
      <aside className="w-full md:w-64 bg-[#0b0f19] text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-md shadow-amber-500/20">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-amber-400 tracking-tight">ChronoBid</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Bid. Win. Own History.</p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto text-xs font-medium">
          {/* OVERVIEW */}
          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Overview</p>
            <a
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold shadow-xs"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </a>
          </div>

          {/* MANAGEMENT */}
          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Management</p>
            <div className="space-y-1">
              <a
                href="/users"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              >
                <Users className="w-4 h-4" />
                <span>Users</span>
              </a>
              <a
                href="/item-approval"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Item Approval</span>
              </a>
              <a
                href="/auctions"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              >
                <Gavel className="w-4 h-4" />
                <span>Auctions</span>
              </a>
            </div>
          </div>

          {/* SECURITY */}
          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Security</p>
            <div className="space-y-1">
              <a
                href="/ai-verification"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              >
                <Cpu className="w-4 h-4" />
                <span>AI Verification</span>
              </a>
              <a
                href="/fraud"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Fraud & Risk</span>
              </a>
            </div>
          </div>

          {/* FINANCE */}
          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Finance</p>
            <a
              href="/finance"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            >
              <DollarSign className="w-4 h-4" />
              <span>Finance & Escrow</span>
            </a>
          </div>

          {/* SYSTEM */}
          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">System</p>
            <a
              href="/settings"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </a>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">PORT 3001 • LIVE DB</span>
          <button
            onClick={logoutAdmin}
            className="p-2 rounded-lg hover:bg-rose-950/60 hover:text-rose-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ─── 2. Main Content Canvas (Light Theme #F8FAFC) ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users, auctions, items, or IDs..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-xs shadow-xs">
                {initials}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{fullName}</p>
                <p className="text-[10px] text-amber-600 font-medium">Super Admin</p>
              </div>
            </div>

            <button
              onClick={logoutAdmin}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
              title="Logout from Power Admin"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dashboard Main Workspace */}
        <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                Power Admin Dashboard
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Monitor ChronoBid operations, approvals, auctions, finance and platform security.
              </p>
            </div>

            <button
              onClick={fetchDashboardMetrics}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh DB Metrics</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ─── 3. TOP 5 KPI CARDS (DATABASE DRIVEN ONLY) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Users */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Users</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {loading ? "..." : (dashboardData?.kpis.total_users ?? 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Registered database accounts</p>
              </div>
            </div>

            {/* Active Auctions */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Active Auctions</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Gavel className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {loading ? "..." : (dashboardData?.kpis.active_auctions ?? 0)}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Currently live</span>
                </p>
              </div>
            </div>

            {/* Platform Revenue */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Platform Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  ${loading ? "..." : (dashboardData?.kpis.platform_revenue?.toLocaleString() ?? "0")}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Calculated platform fees</p>
              </div>
            </div>

            {/* Escrow Locked */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Escrow Locked</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  ${loading ? "..." : (dashboardData?.kpis.escrow_locked?.toLocaleString() ?? "0")}
                </p>
                <p className="text-[11px] text-purple-600 font-medium mt-0.5">Funds currently secured</p>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Pending Approvals</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {loading ? "..." : (dashboardData?.kpis.pending_approvals ?? 0)}
                </p>
                <p className="text-[11px] text-rose-600 font-medium mt-0.5">Requires admin review</p>
              </div>
            </div>
          </div>

          {/* ─── 4. MAIN CONTENT ROW 2: ITEM APPROVAL TABLE & AUCTION OVERVIEW ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ITEM APPROVAL (Main Table - 2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600" />
                    <span>Item Approval</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Items waiting for verification and admin approval</p>
                </div>

                <button
                  onClick={() => setActiveTab("item-approval")}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <span>View All Items</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      <th className="py-3 px-2">Item</th>
                      <th className="py-3 px-2">Seller</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">AI Confidence</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Submitted</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-mono">
                          Loading pending items from database...
                        </td>
                      </tr>
                    ) : !dashboardData?.item_approvals.length ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-mono">
                          No pending items requiring approval.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.item_approvals.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-2 font-medium text-slate-900 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                              <Image
                                src={item.image_url}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="truncate max-w-[130px]" title={item.title}>{item.title}</span>
                          </td>
                          <td className="py-3.5 px-2 text-slate-600">{item.seller}</td>
                          <td className="py-3.5 px-2 text-slate-500 capitalize">{item.category}</td>
                          <td className="py-3.5 px-2 font-mono font-medium">
                            <div className="flex items-center gap-2">
                              <span>{item.ai_confidence}%</span>
                              <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    item.ai_confidence >= 80
                                      ? "bg-emerald-500"
                                      : item.ai_confidence >= 60
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${item.ai_confidence}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                item.status === "AI Verified"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : item.status === "Needs Review"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-slate-400 font-mono text-[11px]">{item.submitted}</td>
                          <td className="py-3.5 px-2 text-right">
                            <button
                              onClick={() => setReviewModalAuction(item)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Review</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AUCTION OVERVIEW (Right Card - 1 Col) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-amber-600" />
                  <span>Auction Overview</span>
                </h3>
                <button
                  onClick={() => setActiveTab("auctions")}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Counter Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Live Auctions</span>
                  <span className="text-2xl font-bold font-mono text-emerald-900">
                    {loading ? "..." : (dashboardData?.auction_overview.live ?? 0)}
                  </span>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-[10px] uppercase font-semibold text-amber-700 block">Ending Today</span>
                  <span className="text-2xl font-bold font-mono text-amber-900">
                    {loading ? "..." : (dashboardData?.auction_overview.ending_today ?? 0)}
                  </span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[10px] uppercase font-semibold text-blue-700 block">Pending Approval</span>
                  <span className="text-2xl font-bold font-mono text-blue-900">
                    {loading ? "..." : (dashboardData?.auction_overview.pending_approval ?? 0)}
                  </span>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <span className="text-[10px] uppercase font-semibold text-purple-700 block">Completed</span>
                  <span className="text-2xl font-bold font-mono text-purple-900">
                    {loading ? "..." : (dashboardData?.auction_overview.completed ?? 0)}
                  </span>
                </div>
              </div>

              {/* Simple Progress Indicators */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Live Bidding Progress</span>
                    <span className="font-mono">{dashboardData?.auction_overview.live || 0} active</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-3/4" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Pending Moderation Queue</span>
                    <span className="font-mono">{dashboardData?.auction_overview.pending_approval || 0} items</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-1/3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 5. MAIN CONTENT ROW 3: FRAUD ALERTS, FINANCE, AI VERIFICATION ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FRAUD & RISK ALERTS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Fraud & Risk Alerts</span>
                </h3>
                <button
                  onClick={() => setActiveTab("fraud-risk")}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  View Fraud Center →
                </button>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <p className="text-xs text-slate-400 font-mono py-4 text-center">Loading fraud logs...</p>
                ) : !dashboardData?.fraud_alerts.length ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-mono bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No active fraud alerts
                  </div>
                ) : (
                  dashboardData.fraud_alerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          alert.severity === "High"
                            ? "bg-rose-100 text-rose-700"
                            : alert.severity === "Medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{alert.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{alert.subtitle} • {alert.reason}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{alert.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FINANCE & ESCROW */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Finance & Escrow</span>
                </h3>
                <button
                  onClick={() => setActiveTab("finance")}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  Manage Finance →
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    <span>Escrow Locked</span>
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    ${loading ? "..." : (dashboardData?.finance.escrow_locked?.toLocaleString() ?? "0")}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Pending Payouts</span>
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    ${loading ? "..." : (dashboardData?.finance.pending_payouts?.toLocaleString() ?? "0")}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Released This Month</span>
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    ${loading ? "..." : (dashboardData?.finance.released_this_month?.toLocaleString() ?? "0")}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Platform Fees</span>
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    ${loading ? "..." : (dashboardData?.finance.platform_fees?.toLocaleString() ?? "0")}
                  </span>
                </div>
              </div>
            </div>

            {/* AI VERIFICATION SUMMARY */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-600" />
                  <span>AI Verification</span>
                </h3>
                <button
                  onClick={() => setActiveTab("ai-verification")}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  Open AI Verification →
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Verified</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {loading ? "..." : (dashboardData?.ai_verification.verified ?? 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Needs Manual Review</span>
                  <span className="font-mono font-bold text-amber-600">
                    {loading ? "..." : (dashboardData?.ai_verification.needs_manual_review ?? 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Rejected</span>
                  <span className="font-mono font-bold text-rose-600">
                    {loading ? "..." : (dashboardData?.ai_verification.rejected ?? 0)}
                  </span>
                </div>

                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-amber-900">AI Verification Accuracy</span>
                    <span className="font-mono font-bold text-amber-800">
                      {loading ? "..." : `${dashboardData?.ai_verification.accuracy ?? 0}%`}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-700/80">Calculated from actual database verification logs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 6. QUICK ADMIN ACTIONS ─── */}
          <div className="pt-2">
            <h3 className="text-sm font-serif font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Quick Admin Actions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/item-approval"
                className="p-4 bg-amber-50/70 hover:bg-amber-100/70 rounded-2xl border border-amber-200/80 text-left transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-amber-900">Review Items</p>
                  <p className="text-[11px] text-amber-700/80 mt-0.5">Items waiting for approval</p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="/fraud"
                className="p-4 bg-rose-50/70 hover:bg-rose-100/70 rounded-2xl border border-rose-200/80 text-left transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-rose-900">Review Fraud Alerts</p>
                  <p className="text-[11px] text-rose-700/80 mt-0.5">Check suspicious activities</p>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-700 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="/auctions"
                className="p-4 bg-blue-50/70 hover:bg-blue-100/70 rounded-2xl border border-blue-200/80 text-left transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-blue-900">Manage Auctions</p>
                  <p className="text-[11px] text-blue-700/80 mt-0.5">View and manage live lots</p>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-700 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="/finance"
                className="p-4 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-2xl border border-emerald-200/80 text-left transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-emerald-900">View Finance</p>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">Escrow, payouts, revenue</p>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </main>
      </div>

      {/* ─── REVIEW & APPROVE MODAL ─── */}
      {reviewModalAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-serif font-bold text-slate-900">Review Auction Lot #{reviewModalAuction.id}</h3>
              <button
                onClick={() => setReviewModalAuction(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                <Image
                  src={reviewModalAuction.image_url}
                  alt={reviewModalAuction.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-1 text-xs text-slate-600 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">{reviewModalAuction.title}</h4>
                <p>Seller: <span className="font-semibold text-slate-800">{reviewModalAuction.seller}</span></p>
                <p>Category: <span className="capitalize">{reviewModalAuction.category}</span></p>
                <p>Reserve Price: <span className="font-bold font-mono text-emerald-700">${reviewModalAuction.reserve_price?.toLocaleString()}</span></p>
                <p>AI Score: <span className="font-bold font-mono text-amber-700">{reviewModalAuction.ai_confidence}% ({reviewModalAuction.status})</span></p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2">
              <p className="font-semibold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Approval Effect:</span>
              </p>
              <p className="text-slate-600">
                Approving will set status to <span className="font-semibold text-emerald-700">Live</span>, reset the start time to current UTC, and extend bidding duration by <span className="font-semibold">+7 days</span>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => handleAuctionAction(reviewModalAuction.id, "reject")}
                className="flex-1 py-3 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Reject Item</span>
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleAuctionAction(reviewModalAuction.id, "approve")}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Approve Lot (+7 Days)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
