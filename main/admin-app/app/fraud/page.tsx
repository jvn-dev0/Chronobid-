'use client';

import React, { useState, useEffect } from 'react';
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
  Cpu,
  RefreshCw,
  Eye,
  AlertOctagon,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Ban,
  Check
} from 'lucide-react';
import { logoutAdmin } from '../../lib/auth';

interface FraudAlertRecord {
  id: string;
  raw_id: number;
  target: string;
  type: string;
  risk: 'Critical' | 'High' | 'Medium' | 'Low';
  score: number;
  details: string;
  status: string;
  date: string;
}

interface FraudKpis {
  total_alerts: number;
  critical_risk: number;
  high_risk: number;
  suspicious_bids: number;
}

export default function PowerAdminFraudPage() {
  const [filterRisk, setFilterRisk] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState<FraudAlertRecord[]>([]);
  const [kpis, setKpis] = useState<FraudKpis>({
    total_alerts: 0,
    critical_risk: 0,
    high_risk: 0,
    suspicious_bids: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlertRecord | null>(null);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('chronobid_admin_token') ||
      localStorage.getItem('admin_token')
    );
  };

  const fetchFraudAlerts = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      const res = await fetch('http://localhost:8000/api/admin/auctions/fraud-alerts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        if (data.kpis) {
          setKpis(data.kpis);
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/';
        }
      }
    } catch (err) {
      console.error('Failed to fetch fraud alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudAlerts();
  }, []);

  const filteredAlerts = alerts.filter((alt) => {
    if (filterRisk !== 'All' && alt.risk !== filterRisk) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTarget = alt.target.toLowerCase().includes(q);
      const matchId = alt.id.toLowerCase().includes(q);
      const matchType = alt.type.toLowerCase().includes(q);
      const matchDetails = alt.details.toLowerCase().includes(q);
      if (!matchTarget && !matchId && !matchType && !matchDetails) return false;
    }

    return true;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 overflow-hidden">
      {/* ─── 1. Left Sidebar Navigation (Dark Slate #0F172A) ─── */}
      <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col shrink-0 z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-100 text-base tracking-tight leading-none">ChronoBid</h1>
              <span className="text-[10px] font-medium text-amber-400 uppercase tracking-widest">Power Admin</span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 text-sm">
          {/* OVERVIEW */}
          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Overview</p>
            <a
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-900"
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold shadow-xs"
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

      {/* ─── 2. Main Content Area ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fraud Detection & Risk Management</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-600" /> Active Threat Monitor
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time anti-collusion, shill bidding detection, velocity limits, and multi-accounting risk logs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchFraudAlerts}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh Risk Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2.5 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                A
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-slate-800">Admin Operations</p>
                <p className="text-[10px] text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <div className="p-6 space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Risk Alerts</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{loading ? '...' : kpis.total_alerts}</p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">Flagged neural anomaly events</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Risk</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertOctagon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600 mt-2">{loading ? '...' : kpis.critical_risk}</p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">Immediate intervention required</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Risk</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2">{loading ? '...' : kpis.high_risk}</p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">Elevated fraud probability score</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suspicious Bids</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{loading ? '...' : kpis.suspicious_bids}</p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">Shill bidding / pattern anomalies</span>
            </div>
          </div>

          {/* Controls Bar (Filter Tabs + Search Bar) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((risk) => (
                <button
                  key={risk}
                  onClick={() => setFilterRisk(risk)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterRisk === risk
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {risk === 'All' ? 'All Risk Logs' : `${risk} Risk`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search alert ID, target entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Fraud Alerts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-4">Alert ID</th>
                    <th className="py-3.5 px-4">Target Entity</th>
                    <th className="py-3.5 px-4">Threat Type</th>
                    <th className="py-3.5 px-4">Risk Score</th>
                    <th className="py-3.5 px-4">Severity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Detected At</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                        Loading live AI fraud logs...
                      </td>
                    </tr>
                  ) : filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No fraud risk alerts match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((alt) => (
                      <tr key={alt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{alt.id}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{alt.target}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {alt.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  alt.score >= 80 ? 'bg-rose-600' : alt.score >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, alt.score))}%` }}
                              ></div>
                            </div>
                            <span className="font-mono text-slate-600">{alt.score}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            alt.risk === 'Critical'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : alt.risk === 'High'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {alt.risk}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            alt.status === 'Flagged'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {alt.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{alt.date}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedAlert(alt)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 inline-flex"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Detailed Fraud Investigation Modal ─── */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Risk Log Investigation • {selectedAlert.id}</h3>
                  <p className="text-xs text-slate-500">Threat Type: {selectedAlert.type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Target Entity:</span>
                  <span className="font-bold text-slate-900">{selectedAlert.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Severity Assessment:</span>
                  <span className={`font-bold ${selectedAlert.risk === 'Critical' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {selectedAlert.risk} ({selectedAlert.score}% Anomaly Index)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Detection Date:</span>
                  <span className="font-mono text-slate-700">{selectedAlert.date}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">AI Neural Threat Rationale</h4>
                <div className="p-3 bg-slate-900 text-rose-300 font-mono text-[11px] rounded-xl leading-relaxed">
                  {selectedAlert.details}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Dismiss Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
