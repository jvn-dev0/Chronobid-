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
  Cpu,
  RefreshCw,
  Save,
  DollarSign,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import { logoutAdmin } from '../../lib/auth';

interface SystemConfig {
  seller_commission_fee: number;
  buyer_premium_fee: number;
  listing_fee: number;
  auto_approve_ocr: number;
  auto_reject_face: number;
}

export default function PowerAdminSettingsPage() {
  const [config, setConfig] = useState<SystemConfig>({
    seller_commission_fee: 5.0,
    buyer_premium_fee: 10.0,
    listing_fee: 25.0,
    auto_approve_ocr: 85,
    auto_reject_face: 40,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('chronobid_admin_token') ||
      localStorage.getItem('admin_token')
    );
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      const res = await fetch('http://localhost:8000/api/admin/settings/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setConfig({
          seller_commission_fee: data.seller_commission_fee ?? 5.0,
          buyer_premium_fee: data.buyer_premium_fee ?? 10.0,
          listing_fee: data.listing_fee ?? 25.0,
          auto_approve_ocr: data.auto_approve_ocr ?? 85,
          auto_reject_face: data.auto_reject_face ?? 40,
        });
      } else {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/';
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg('');

    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      const res = await fetch('http://localhost:8000/api/admin/settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || 'Failed to save configuration settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrorMsg('Network error while connecting to server');
    } finally {
      setSaving(false);
    }
  };

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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold shadow-xs"
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
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Configuration & Thresholds</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-emerald-600" /> Database-Persisted Settings
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust commission fees, listing premiums, and AI automated threshold policies across ChronoBid
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettings}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Reload System Settings"
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
        <div className="p-6 max-w-4xl space-y-6">
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              System configuration saved successfully to Supabase PostgreSQL database!
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Financial Parameters Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Financial & Fee Structures</h3>
                <p className="text-xs text-slate-500">Global commission percentages and listing fee schedules</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seller Commission Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={config.seller_commission_fee}
                    onChange={(e) => setConfig({ ...config, seller_commission_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Premium Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={config.buyer_premium_fee}
                    onChange={(e) => setConfig({ ...config, buyer_premium_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Listing Base Fee ($)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={config.listing_fee}
                    onChange={(e) => setConfig({ ...config, listing_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* AI Automated Thresholds Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">AI Automated Approval & Risk Thresholds</h3>
                <p className="text-xs text-slate-500">Neural confidence cutoffs for automated item verification and face match</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Auto-Approve OCR Threshold (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.auto_approve_ocr}
                    onChange={(e) => setConfig({ ...config, auto_approve_ocr: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white text-slate-800 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Items exceeding this OCR score pass verification automatically.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Auto-Reject Face Match Threshold (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.auto_reject_face}
                    onChange={(e) => setConfig({ ...config, auto_reject_face: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white text-slate-800 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Identity verifications falling below this score trigger manual review.</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving Configuration...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save System Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
