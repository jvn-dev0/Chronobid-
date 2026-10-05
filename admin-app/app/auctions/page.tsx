'use client';

import React, { useState, useEffect } from 'react';
import { getAdminSession, logoutAdmin, ADMIN_CONFIG } from '../../lib/auth';

interface AuctionRecord {
  id: number;
  title: string;
  seller: string;
  seller_id?: number;
  category: string;
  reserve_price: number;
  current_highest_bid?: number;
  bids_count: number;
  status: string;
  start_time: string;
  end_time: string;
  image_url: string;
}

interface AuctionDetail {
  id: number;
  title: string;
  reserve_price: number;
  highest_bid: number;
  status: string;
  category: string;
  start_time: string;
  end_time: string;
  seller?: {
    id: number;
    name: string;
    username: string;
    email: string;
    verification_status: string;
    trust_score: number;
  };
  bids: { id: number; bidder_name: string; username: string; amount: number; timestamp: string }[];
  image_url: string;
}

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, title?: string, category?: string) => {
  const target = e.currentTarget;
  const text = (title || category || '').toLowerCase();
  if (text.includes('jewel') || text.includes('gold') || text.includes('ring') || text.includes('diamond') || text.includes('emerald') || text.includes('ruby')) {
    target.src = '/category-assets/jewellery.png';
  } else if (text.includes('art') || text.includes('paint') || text.includes('canvas')) {
    target.src = '/category-assets/art.png';
  } else if (text.includes('coin') || text.includes('currency')) {
    target.src = '/category-assets/coins.png';
  } else if (text.includes('car') || text.includes('auto')) {
    target.src = '/category-assets/automobiles.png';
  } else {
    target.src = '/category-assets/watches.png';
  }
};

export default function PowerAdminAuctionsPage() {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Live' | 'Ending_Soon' | 'Draft' | 'Completed' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [auctions, setAuctions] = useState<AuctionRecord[]>([]);
  const [kpis, setKpis] = useState({
    total_auctions: 0,
    active_auctions: 0,
    ending_today: 0,
    total_volume: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<AuctionDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [controlLoading, setControlLoading] = useState(false);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('chronobid_admin_token') ||
      localStorage.getItem('admin_token')
    );
  };

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      const queryParams = new URLSearchParams({
        status_filter: statusFilter,
      });
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      const res = await fetch(`https://chronobid-backend.onrender.com/api/admin/auctions/manage?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAuctions(data.auctions || []);
        if (data.kpis) {
          setKpis(data.kpis);
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/';
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuctions();
  };

  const inspectAuction = async (auctionId: number) => {
    setModalLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`https://chronobid-backend.onrender.com/api/admin/auctions/${auctionId}/inspect`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAuction(data);
      }
    } catch (err) {
      console.error('Failed to inspect auction:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleControlAction = async (auctionId: number, action: 'extend' | 'pause' | 'resume' | 'cancel', days: number = 1) => {
    setControlLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`https://chronobid-backend.onrender.com/api/admin/auctions/${auctionId}/control?action=${action}&days=${days}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setSelectedAuction(null);
        fetchAuctions();
      } else {
        const err = await res.json();
        alert(err.detail || 'Control action failed');
      }
    } catch (err) {
      alert('Network error while processing auction control command');
    } finally {
      setControlLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0F17', color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ══════════ SIDEBAR NAVIGATION ══════════ */}
      <aside style={{ width: '260px', backgroundColor: '#0F172A', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', fontSize: '18px' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#F8FAFC', letterSpacing: '0.5px' }}>ChronoBid</div>
            <div style={{ fontSize: '11px', color: '#D4AF37', fontWeight: '600', letterSpacing: '1px' }}>POWER ADMIN</div>
          </div>
        </div>

        <nav style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#94A3B8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            📊 Dashboard
          </a>
          <a href="/users" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#94A3B8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            👥 Users
          </a>
          <a href="/item-approval" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#94A3B8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            🔍 Item Approval
          </a>
          <a href="/auctions" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#1E293B', color: '#D4AF37', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            🔨 Auctions
          </a>
          <a href="/ai-verification" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#94A3B8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            🤖 AI Verification
          </a>
          <a href="/fraud" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#94A3B8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            🛡️ Fraud &amp; Risk
          </a>
          <a href="/finance" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#94A3B8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            💳 Finance
          </a>
          <a href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#94A3B8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            ⚙️ Settings
          </a>
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1E293B', fontSize: '12px', color: '#64748B' }}>
          Database Source: <span style={{ color: '#22C55E', fontWeight: '600' }}>Live connected</span>
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT AREA ══════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* TOP HEADER */}
        <header style={{ height: '70px', backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>Auction Management</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>Monitor live auctions, inspect bid histories, and execute emergency controls.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.3)', fontWeight: '600' }}>
              🔒 Protected Admin Area
            </span>
          </div>
        </header>

        {/* CONTENT WRAPPER */}
        <main style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          
          {/* TOP KPI ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Auctions</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#3B82F6', marginTop: '8px' }}>{kpis.total_auctions}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Recorded in database</div>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live &amp; Active</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#22C55E', marginTop: '8px' }}>{kpis.active_auctions}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Bidding open now</div>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ending Today</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#F59E0B', marginTop: '8px' }}>{kpis.ending_today}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Ending within 24h</div>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Bid Volume</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#D4AF37', marginTop: '8px' }}>${kpis.total_volume.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Placed across all lots</div>
            </div>
          </div>

          {/* CONTROLS: TABS & SEARCH */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* STATUS FILTER TABS */}
            <div style={{ display: 'flex', backgroundColor: '#1E293B', padding: '4px', borderRadius: '10px', border: '1px solid #334155' }}>
              {(['All', 'Live', 'Ending_Soon', 'Draft', 'Completed', 'Cancelled'] as const).map(tab => {
                const isActive = statusFilter === tab;
                let label = 'All Auctions';
                if (tab === 'Live') label = 'Live & Active';
                if (tab === 'Ending_Soon') label = 'Ending Soon';
                if (tab === 'Draft') label = 'Draft / Pending';
                if (tab === 'Completed') label = 'Completed';
                if (tab === 'Cancelled') label = 'Cancelled';

                return (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? '600' : '500',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: isActive ? '#D4AF37' : 'transparent',
                      color: isActive ? '#000000' : '#94A3B8',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* SEARCH FORM */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search auction title, seller, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#E2E8F0',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  width: '260px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </form>
          </div>

          {/* MAIN TABLE OR EMPTY STATE */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
            
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                Loading auctions from database...
              </div>
            ) : auctions.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔨</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#F8FAFC' }}>No auctions found</div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  No auction lots match your selected filter in the database.
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '16px 20px' }}>Auction Lot</th>
                    <th style={{ padding: '16px' }}>Seller</th>
                    <th style={{ padding: '16px' }}>Category</th>
                    <th style={{ padding: '16px' }}>Reserve Price</th>
                    <th style={{ padding: '16px' }}>Highest Bid</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>End Time</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map(auc => {
                    let statusBg = '#334155';
                    let statusColor = '#94A3B8';
                    if (auc.status === 'Live') {
                      statusBg = 'rgba(34, 197, 94, 0.1)';
                      statusColor = '#22C55E';
                    } else if (auc.status === 'Pending_Verification' || auc.status === 'Draft') {
                      statusBg = 'rgba(245, 158, 11, 0.1)';
                      statusColor = '#F59E0B';
                    } else if (auc.status === 'Paused') {
                      statusBg = 'rgba(59, 130, 246, 0.1)';
                      statusColor = '#3B82F6';
                    } else if (auc.status === 'Cancelled' || auc.status === 'Rejected') {
                      statusBg = 'rgba(239, 68, 68, 0.1)';
                      statusColor = '#EF4444';
                    }

                    return (
                      <tr key={auc.id} style={{ borderBottom: '1px solid #334155' }}>
                        
                        {/* LOT THUMBNAIL + TITLE */}
                        <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img
                            src={auc.image_url}
                            alt={auc.title}
                            onError={(e) => handleImageError(e, auc.title, auc.category)}
                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', backgroundColor: '#0F172A', border: '1px solid #334155' }}
                          />
                          <div>
                            <div style={{ fontWeight: '600', color: '#F8FAFC', fontSize: '14px' }}>{auc.title}</div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Auction #{auc.id}</div>
                          </div>
                        </td>

                        {/* SELLER */}
                        <td style={{ padding: '16px', color: '#E2E8F0', fontWeight: '500' }}>
                          {auc.seller}
                        </td>

                        {/* CATEGORY */}
                        <td style={{ padding: '16px', color: '#94A3B8' }}>
                          {auc.category}
                        </td>

                        {/* RESERVE PRICE */}
                        <td style={{ padding: '16px', color: '#94A3B8', fontWeight: '500' }}>
                          ${auc.reserve_price.toLocaleString()}
                        </td>

                        {/* HIGHEST BID */}
                        <td style={{ padding: '16px' }}>
                          {auc.current_highest_bid ? (
                            <div>
                              <div style={{ fontWeight: '700', color: '#D4AF37' }}>${auc.current_highest_bid.toLocaleString()}</div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{auc.bids_count} bid(s)</div>
                            </div>
                          ) : (
                            <span style={{ color: '#64748B', fontSize: '12px' }}>No bids yet</span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: statusBg, color: statusColor, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            {auc.status}
                          </span>
                        </td>

                        {/* END TIME */}
                        <td style={{ padding: '16px', color: '#94A3B8', fontSize: '12px' }}>
                          {auc.end_time}
                        </td>

                        {/* ACTIONS */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => inspectAuction(auc.id)}
                            style={{
                              backgroundColor: '#0F172A',
                              border: '1px solid #334155',
                              color: '#D4AF37',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Inspect Bids &amp; Controls
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* ══════════ AUCTION INSPECTION & CONTROL MODAL ══════════ */}
      {selectedAuction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          
          <div style={{ backgroundColor: '#0F172A', borderRadius: '16px', border: '1px solid #334155', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>{selectedAuction.title}</h2>
                  <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#1E293B', color: '#D4AF37', border: '1px solid #334155' }}>
                    Auction #{selectedAuction.id}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  Status: <span style={{ color: selectedAuction.status === 'Live' ? '#22C55E' : '#F59E0B', fontWeight: '600' }}>{selectedAuction.status}</span> • Seller: <span style={{ color: '#E2E8F0' }}>{selectedAuction.seller?.name}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAuction(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '24px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* MODAL CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '28px' }}>
              
              {/* LEFT: AUCTION LOT & RESERVE PROGRESS */}
              <div>
                <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#1E293B', border: '1px solid #334155', marginBottom: '16px' }}>
                  <img
                    src={selectedAuction.image_url}
                    alt={selectedAuction.title}
                    onError={(e) => handleImageError(e, selectedAuction.title, selectedAuction.category)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Reserve Progress Box */}
                <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#94A3B8' }}>Reserve Price:</span>
                    <strong style={{ color: '#E2E8F0' }}>${selectedAuction.reserve_price.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
                    <span style={{ color: '#94A3B8' }}>Highest Active Bid:</span>
                    <strong style={{ color: '#D4AF37', fontSize: '16px' }}>${selectedAuction.highest_bid.toLocaleString()}</strong>
                  </div>

                  {/* Progress Bar */}
                  {selectedAuction.reserve_price > 0 && (
                    <div>
                      <div style={{ width: '100%', backgroundColor: '#0F172A', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (selectedAuction.highest_bid / selectedAuction.reserve_price) * 100)}%`, backgroundColor: selectedAuction.highest_bid >= selectedAuction.reserve_price ? '#22C55E' : '#D4AF37', height: '100%', transition: 'width 0.3s ease' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', textAlign: 'right' }}>
                        {selectedAuction.highest_bid >= selectedAuction.reserve_price ? 'Reserve Met ✓' : `${Math.round((selectedAuction.highest_bid / selectedAuction.reserve_price) * 100)}% of Reserve Met`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: REAL BID HISTORY & EMERGENCY CONTROLS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Real Bid History Table */}
                <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontWeight: '700', color: '#F8FAFC', fontSize: '14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📜 Live Bid History</span>
                    <span style={{ fontSize: '12px', color: '#D4AF37' }}>{selectedAuction.bids.length} total bid(s)</span>
                  </div>

                  {selectedAuction.bids.length === 0 ? (
                    <div style={{ color: '#64748B', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
                      No bids have been placed on this auction yet.
                    </div>
                  ) : (
                    <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ color: '#64748B', borderBottom: '1px solid #334155' }}>
                            <th style={{ padding: '6px' }}>Bidder</th>
                            <th style={{ padding: '6px' }}>Amount</th>
                            <th style={{ padding: '6px' }}>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAuction.bids.map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid #0F172A' }}>
                              <td style={{ padding: '8px 6px', color: '#E2E8F0', fontWeight: '500' }}>{b.bidder_name}</td>
                              <td style={{ padding: '8px 6px', color: '#D4AF37', fontWeight: '700' }}>${b.amount.toLocaleString()}</td>
                              <td style={{ padding: '8px 6px', color: '#64748B', fontSize: '11px' }}>{b.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Emergency Control Panel */}
                <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontWeight: '700', color: '#F8FAFC', fontSize: '14px', marginBottom: '12px' }}>🚨 Emergency Admin Controls</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={() => handleControlAction(selectedAuction.id, 'extend', 1)}
                      disabled={controlLoading}
                      style={{ backgroundColor: '#334155', color: '#F8FAFC', border: '1px solid #475569', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      + Extend 24 Hours
                    </button>
                    
                    <button
                      onClick={() => handleControlAction(selectedAuction.id, 'extend', 7)}
                      disabled={controlLoading}
                      style={{ backgroundColor: '#334155', color: '#F8FAFC', border: '1px solid #475569', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      + Extend 7 Days
                    </button>

                    {selectedAuction.status === 'Live' ? (
                      <button
                        onClick={() => handleControlAction(selectedAuction.id, 'pause')}
                        disabled={controlLoading}
                        style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        ⏸ Pause Bidding
                      </button>
                    ) : (
                      <button
                        onClick={() => handleControlAction(selectedAuction.id, 'resume')}
                        disabled={controlLoading}
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.4)', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        ▶ Resume Auction
                      </button>
                    )}

                    <button
                      onClick={() => handleControlAction(selectedAuction.id, 'cancel')}
                      disabled={controlLoading}
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      🛑 Cancel Auction
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* MODAL FOOTER */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #1E293B', paddingTop: '20px' }}>
              <button
                onClick={() => setSelectedAuction(null)}
                style={{ backgroundColor: '#1E293B', color: '#94A3B8', border: '1px solid #334155', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
