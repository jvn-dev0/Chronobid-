'use client';
import React, { useEffect } from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';

export default function AdminRedirectNotice() {
  useEffect(() => {
    // Redirect to standalone Power Admin Portal on port 3001
    const timer = setTimeout(() => {
      window.location.href = 'http://localhost:3001/';
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl shadow-amber-500/10">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-serif font-bold text-amber-300 mb-2">
        Power Admin App Relocated
      </h1>

      <p className="text-xs text-slate-300 max-w-md mb-6 leading-relaxed">
        The ChronoBid Power Admin application runs on its dedicated localhost port at <code className="text-amber-400 font-mono">http://localhost:3001/</code>.
      </p>

      <a
        href="http://localhost:3001/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-xs hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
      >
        <span>Open Power Admin (Port 3001)</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
