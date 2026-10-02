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
  Check,
  X,
  AlertTriangle,
  FileText,
  DollarSign,
  Activity
} from 'lucide-react';
import { logoutAdmin } from '../../lib/auth';

interface AIReportRecord {
  id: string;
  raw_id: number;
  type: string;
  target: string;
  ocrConfidence: number;
  faceMatch: number;
  risk: string;
  status: string;
  details: string;
  date: string;
}

interface AIKpis {
  total_scanned: number;
  pass_rate: number;
  identity_scans: number;
  object_scans: number;
  flagged_items: number;
}

export default function PowerAdminAIVerificationPage() {
  const [filterType, setFilterType] = useState<'All' | 'Identity Verification' | 'Object Detection' | 'Flagged'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<AIReportRecord[]>([]);
  const [kpis, setKpis] = useState<AIKpis>({
    total_scanned: 0,
    pass_rate: 100.0,
    identity_scans: 0,
    object_scans: 0,
    flagged_items: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AIReportRecord | null>(null);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('chronobid_admin_token') ||
      localStorage.getItem('admin_token')
    );
  };

  const fetchAIReports = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      const res = await fetch('http://localhost:8000/api/admin/auctions/ai-reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        if (data.kpis) {
          setKpis(data.kpis);
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/';
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI verification reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIReports();
  }, []);

  const filteredReports = reports.filter((rep) => {
    if (filterType === 'Identity Verification' && rep.type !== 'Identity Verification') return false;
    if (filterType === 'Object Detection' && rep.type !== 'Object Detection') return false;
    if (filterType === 'Flagged' && rep.status !== 'Flagged') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTarget = rep.target.toLowerCase().includes(q);
      const matchId = rep.id.toLowerCase().includes(q);
      const matchType = rep.type.toLowerCase().includes(q);
      if (!matchTarget && !matchId && !matchType) return false;
    }

    return true;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 overflow-hidden">
      <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col shrink-0 z-30">
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

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 text-sm">
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

          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Security</p>
            <div className="space-y-1">
              <a
                href="/ai-verification"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold shadow-xs"
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

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Verification & Neural Screening</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live DB Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time computer vision, CLIP similarity, EasyOCR document analysis, and biometric verification logs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAIReports}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh AI Audit Records"
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

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total AI Scans</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{loading ? '...' : kpis.total_scanned}</p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">Direct database verification logs</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Pass Rate</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2">{loading ? '...' : `${kpis.pass_rate}%`}</p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">High confidence automated approvals</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identity Verifications</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{loading ? '...' : kpis.identity_scans}</p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">OCR & Biometrics checked</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Object Scans</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{loading ? '...' : kpis.object_scans}</p>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">CLIP & Met Museum embeddings</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['All', 'Identity Verification', 'Object Detection', 'Flagged'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterType === tab
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'All' ? 'All Audit Records' : tab}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search report ID, target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-4">Report ID</th>
                    <th className="py-3.5 px-4">Scan Type</th>
                    <th className="py-3.5 px-4">Target Entity</th>
                    <th className="py-3.5 px-4">OCR / AI Conf.</th>
                    <th className="py-3.5 px-4">Face Match / Score</th>
                    <th className="py-3.5 px-4">Risk Level</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                        Loading live AI verification records...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No AI verification records match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{rep.id}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            rep.type === 'Identity Verification'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {rep.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{rep.target}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  rep.ocrConfidence >= 80 ? 'bg-emerald-500' : rep.ocrConfidence >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, rep.ocrConfidence))}%` }}
                              ></div>
                            </div>
                            <span className="font-mono text-slate-600">{rep.ocrConfidence}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  rep.faceMatch >= 80 ? 'bg-emerald-500' : rep.faceMatch >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, rep.faceMatch))}%` }}
                              ></div>
                            </div>
                            <span className="font-mono text-slate-600">{rep.faceMatch}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            rep.risk === 'Low'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {rep.risk} Risk
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            rep.status === 'Passed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {rep.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedReport(rep)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 inline-flex"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Inspect
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

      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">AI Audit Detail • {selectedReport.id}</h3>
                  <p className="text-xs text-slate-500">{selectedReport.type} Report</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Target Entity:</span>
                  <span className="font-bold text-slate-900">{selectedReport.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Report Status:</span>
                  <span className={`font-bold ${selectedReport.status === 'Passed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedReport.status} ({selectedReport.risk} Risk)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Scan Timestamp:</span>
                  <span className="font-mono text-slate-700">{selectedReport.date}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Neural Metrics Breakdown</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-[11px]">OCR / Model Confidence</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{selectedReport.ocrConfidence}%</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-[11px]">Biometric / Match Score</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{selectedReport.faceMatch}%</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Detailed Logs & Audit Notes</h4>
                <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl leading-relaxed">
                  {selectedReport.details}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
