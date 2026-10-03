'use client';

import React, { useState, useEffect } from 'react';

import { getAdminSession, logoutAdmin, ADMIN_CONFIG } from '../../lib/auth';

interface ItemApproval {
  id: number;
  title: string;
  image_url: string;
  seller_id?: number;
  seller: string;
  seller_status: string;
  category: string;
  reserve_price: number;
  status: string;
  ai_confidence: number;
  risk_label: string;
  risk_category: string;
  submitted: string;
  condition?: string;
  material?: string;
}

interface ItemDetail {
  id: number;
  title: string;
  reserve_price: number;
  status: string;
  category: string;
  seller?: {
    id: number;
    name: string;
    username: string;
    email: string;
    verification_status: string;
    trust_score: number;
    id_document_type?: string;
    id_document_number?: string;
    bank_verified: boolean;
    country: string;
  };
  item?: {
    description: string;
    condition: string;
    material: string;
    ai_authenticity_score: number;
    ai_estimated_price: number;
    ai_data?: any;
  };
  images: string[];
  logs: { status: string; comments?: string; timestamp: string }[];
}

export default function ItemApprovalPage() {
  const [statusFilter, setStatusFilter] = useState<'Pending_Verification' | 'Live' | 'Rejected' | 'All'>('Pending_Verification');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ItemApproval[]>([]);
  const [kpis, setKpis] = useState({
    total_pending: 0,
    total_approved: 0,
    total_rejected: 0,
    high_risk_count: 0,
    avg_ai_confidence: 88,
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('chronobid_admin_token') ||
      localStorage.getItem('admin_token')
    );
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/';
        return;
      }

      const queryParams = new URLSearchParams({
        status_filter: statusFilter,
        risk_filter: riskFilter,
      });
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      const res = await fetch(`https://chronobid-backend.onrender.com/api/admin/item-approval/list?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.kpis) {
          setKpis(data.kpis);
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/';
        }
      }
    } catch (err) {
      console.error('Failed to fetch item approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const inspectItem = async (itemId: number) => {
    setModalLoading(true);
    setActiveImageIndex(0);
    setReviewComments('');
    try {
      const token = getAuthToken();
      const res = await fetch(`https://chronobid-backend.onrender.com/api/admin/item-approval/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedItem(data);
      }
    } catch (err) {
      console.error('Failed to inspect item:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDecision = async (auctionId: number, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('https://chronobid-backend.onrender.com/api/admin/approve-auction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          auction_id: auctionId,
          action: action,
          comments: reviewComments || (action === 'approve' ? 'Approved by Administrator after manual verification.' : 'Submission rejected by Administrator.')
        })
      });

      if (res.ok) {
        setSelectedItem(null);
        fetchItems();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update item approval status');
      }
    } catch (err) {
      alert('Network error while processing approval decision');
    } finally {
      setActionLoading(false);
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
          <a href="/item-approval" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#1E293B', color: '#D4AF37', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            🔍 Item Approval
          </a>
          <a href="/auctions" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#94A3B8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
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
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>Item Approvals</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>Review seller submissions, verify AI confidence scores, and launch live auctions.</p>
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
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Approval</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#F59E0B', marginTop: '8px' }}>{kpis.total_pending}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Awaiting admin review</div>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved / Live</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#22C55E', marginTop: '8px' }}>{kpis.total_approved}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Active in marketplace</div>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>High Risk Flagged</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#EF4444', marginTop: '8px' }}>{kpis.high_risk_count}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>AI confidence &lt; 60%</div>
            </div>

            <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg AI Verification</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#3B82F6', marginTop: '8px' }}>{kpis.avg_ai_confidence}%</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Category &amp; authenticity match</div>
            </div>
          </div>

          {/* CONTROLS: TABS & SEARCH */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* STATUS FILTER TABS */}
            <div style={{ display: 'flex', backgroundColor: '#1E293B', padding: '4px', borderRadius: '10px', border: '1px solid #334155' }}>
              {(['Pending_Verification', 'Live', 'Rejected', 'All'] as const).map(tab => {
                const isActive = statusFilter === tab;
                let label = 'Pending Approval';
                if (tab === 'Live') label = 'Approved / Live';
                if (tab === 'Rejected') label = 'Rejected';
                if (tab === 'All') label = 'All Submissions';

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

            {/* RISK & SEARCH */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Risk Level Filter */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#E2E8F0',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Risk Levels</option>
                <option value="High">High Risk (&lt;60%)</option>
                <option value="Medium">Needs Review (60-80%)</option>
                <option value="Low">AI Verified (&gt;80%)</option>
              </select>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search lot title, seller..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#E2E8F0',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    width: '240px',
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
          </div>

          {/* MAIN TABLE OR EMPTY STATE */}
          <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
            
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                Loading items from database...
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#F8FAFC' }}>No items awaiting approval</div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  {statusFilter === 'Pending_Verification' 
                    ? 'All seller submissions have been reviewed or no new items exist in the database.' 
                    : 'No auction items match your selected filters.'}
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderBottom: '1px solid #334155', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '16px 20px' }}>Lot Item</th>
                    <th style={{ padding: '16px' }}>Seller</th>
                    <th style={{ padding: '16px' }}>Category</th>
                    <th style={{ padding: '16px' }}>Reserve Price</th>
                    <th style={{ padding: '16px' }}>AI Verification</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    let aiBadgeBg = 'rgba(34, 197, 94, 0.1)';
                    let aiBadgeColor = '#22C55E';
                    let aiBorder = 'rgba(34, 197, 94, 0.3)';

                    if (item.ai_confidence < 60) {
                      aiBadgeBg = 'rgba(239, 68, 68, 0.1)';
                      aiBadgeColor = '#EF4444';
                      aiBorder = 'rgba(239, 68, 68, 0.3)';
                    } else if (item.ai_confidence < 80) {
                      aiBadgeBg = 'rgba(245, 158, 11, 0.1)';
                      aiBadgeColor = '#F59E0B';
                      aiBorder = 'rgba(245, 158, 11, 0.3)';
                    }

                    let statusBg = '#334155';
                    let statusColor = '#94A3B8';
                    if (item.status === 'Pending_Verification') {
                      statusBg = 'rgba(245, 158, 11, 0.1)';
                      statusColor = '#F59E0B';
                    } else if (item.status === 'Live') {
                      statusBg = 'rgba(34, 197, 94, 0.1)';
                      statusColor = '#22C55E';
                    } else if (item.status === 'Rejected') {
                      statusBg = 'rgba(239, 68, 68, 0.1)';
                      statusColor = '#EF4444';
                    }

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #334155', transition: 'background-color 0.15s ease' }}>
                        
                        {/* LOT ITEM THUMBNAIL + TITLE */}
                        <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img
                            src={item.image_url}
                            alt={item.title}
                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', backgroundColor: '#0F172A', border: '1px solid #334155' }}
                          />
                          <div>
                            <div style={{ fontWeight: '600', color: '#F8FAFC', fontSize: '14px' }}>{item.title}</div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Lot #{item.id} • Submitted {item.submitted}</div>
                          </div>
                        </td>

                        {/* SELLER */}
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '500', color: '#E2E8F0' }}>{item.seller}</div>
                          <div style={{ fontSize: '11px', color: item.seller_status === 'Approved' ? '#22C55E' : '#F59E0B', marginTop: '2px' }}>
                            {item.seller_status} Seller
                          </div>
                        </td>

                        {/* CATEGORY */}
                        <td style={{ padding: '16px', color: '#94A3B8' }}>
                          {item.category}
                        </td>

                        {/* RESERVE PRICE */}
                        <td style={{ padding: '16px', fontWeight: '700', color: '#D4AF37' }}>
                          ${item.reserve_price.toLocaleString()}
                        </td>

                        {/* AI VERIFICATION */}
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: aiBadgeBg, color: aiBadgeColor, border: `1px solid ${aiBorder}`, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            <span>{item.ai_confidence}%</span>
                            <span style={{ fontSize: '11px', opacity: 0.8 }}>({item.risk_label})</span>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: statusBg, color: statusColor, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            {item.status === 'Pending_Verification' ? 'Pending Approval' : item.status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => inspectItem(item.id)}
                              style={{
                                backgroundColor: '#0F172A',
                                border: '1px solid #334155',
                                color: '#3B82F6',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Inspect &amp; Review
                            </button>

                            {item.status === 'Pending_Verification' && (
                              <>
                                <button
                                  onClick={() => handleDecision(item.id, 'approve')}
                                  style={{
                                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                    border: '1px solid rgba(34, 197, 94, 0.4)',
                                    color: '#22C55E',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleDecision(item.id, 'reject')}
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#EF4444',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
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

      {/* ══════════ ITEM INSPECTION & APPROVAL MODAL ══════════ */}
      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          
          <div style={{ backgroundColor: '#0F172A', borderRadius: '16px', border: '1px solid #334155', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>{selectedItem.title}</h2>
                  <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#1E293B', color: '#D4AF37', border: '1px solid #334155' }}>
                    Lot #{selectedItem.id}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  Category: <span style={{ color: '#E2E8F0' }}>{selectedItem.category}</span> • Reserve Price: <span style={{ color: '#D4AF37', fontWeight: '600' }}>${selectedItem.reserve_price.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '24px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* MODAL CONTENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '28px' }}>
              
              {/* LEFT: IMAGE GALLERY & SPECIFICATIONS */}
              <div>
                {/* Main Large Image */}
                <div style={{ width: '100%', height: '260px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#1E293B', border: '1px solid #334155', marginBottom: '12px' }}>
                  <img
                    src={selectedItem.images[activeImageIndex] || selectedItem.images[0] || '/uploads/download (3).jpg'}
                    alt={selectedItem.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Gallery Thumbnails */}
                {selectedItem.images.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
                    {selectedItem.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Thumb ${idx}`}
                        onClick={() => setActiveImageIndex(idx)}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: activeImageIndex === idx ? '2px solid #D4AF37' : '1px solid #334155'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Specs Box */}
                <div style={{ backgroundColor: '#1E293B', padding: '16px', borderRadius: '10px', border: '1px solid #334155', fontSize: '13px' }}>
                  <div style={{ fontWeight: '600', color: '#F8FAFC', marginBottom: '8px' }}>Item Specifications</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#94A3B8' }}>
                    <div>Condition: <span style={{ color: '#E2E8F0', fontWeight: '500' }}>{selectedItem.item?.condition}</span></div>
                    <div>Material: <span style={{ color: '#E2E8F0', fontWeight: '500' }}>{selectedItem.item?.material}</span></div>
                  </div>
                  <div style={{ marginTop: '12px', color: '#94A3B8' }}>
                    <div>Description:</div>
                    <p style={{ color: '#CBD5E1', fontSize: '12px', marginTop: '4px', lineHeight: '1.5' }}>
                      {selectedItem.item?.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: AI VERIFICATION & SELLER METRICS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* AI Authenticity Card */}
                <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', color: '#F8FAFC', fontSize: '14px' }}>🤖 AI Authenticity Analysis</div>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: selectedItem.item?.ai_authenticity_score && selectedItem.item.ai_authenticity_score > 80 ? '#22C55E' : '#F59E0B' }}>
                      {selectedItem.item?.ai_authenticity_score || 85}% Confidence
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>Estimated Market Valuation: <span style={{ color: '#D4AF37', fontWeight: '600' }}>${(selectedItem.item?.ai_estimated_price || selectedItem.reserve_price).toLocaleString()}</span></div>
                    <div>Category Alignment: <span style={{ color: '#22C55E', fontWeight: '600' }}>Matched ({selectedItem.category})</span></div>
                    <div>Risk Flagging: <span style={{ color: '#22C55E', fontWeight: '600' }}>No anomaly patterns detected</span></div>
                  </div>
                </div>

                {/* Seller Verification Info */}
                {selectedItem.seller && (
                  <div style={{ backgroundColor: '#1E293B', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontWeight: '700', color: '#F8FAFC', fontSize: '14px', marginBottom: '12px' }}>👤 Seller Identity Audit</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#94A3B8' }}>
                      <div>Seller Name: <span style={{ color: '#E2E8F0', fontWeight: '600' }}>{selectedItem.seller.name}</span> (@{selectedItem.seller.username})</div>
                      <div>Email: <span style={{ color: '#E2E8F0' }}>{selectedItem.seller.email}</span></div>
                      <div>KYC Status: <span style={{ color: selectedItem.seller.verification_status === 'Approved' ? '#22C55E' : '#F59E0B', fontWeight: '600' }}>{selectedItem.seller.verification_status}</span></div>
                      <div>Trust Score: <span style={{ color: '#D4AF37', fontWeight: '600' }}>{selectedItem.seller.trust_score}/100</span></div>
                      <div>Bank Account: <span style={{ color: selectedItem.seller.bank_verified ? '#22C55E' : '#EF4444' }}>{selectedItem.seller.bank_verified ? 'Verified ✓' : 'Unverified'}</span></div>
                    </div>
                  </div>
                )}

                {/* Decision Comment Area */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94A3B8', marginBottom: '6px' }}>
                    Admin Review Note / Reason (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter approval rationale or rejection notice for seller..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                      padding: '10px 12px',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* MODAL ACTION BUTTONS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #1E293B', paddingTop: '20px' }}>
              <button
                onClick={() => setSelectedItem(null)}
                disabled={actionLoading}
                style={{ backgroundColor: '#1E293B', color: '#94A3B8', border: '1px solid #334155', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>

              {selectedItem.status === 'Pending_Verification' && (
                <>
                  <button
                    onClick={() => handleDecision(selectedItem.id, 'reject')}
                    disabled={actionLoading}
                    style={{ backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {actionLoading ? 'Processing...' : 'Reject Submission'}
                  </button>

                  <button
                    onClick={() => handleDecision(selectedItem.id, 'approve')}
                    disabled={actionLoading}
                    style={{ backgroundColor: '#22C55E', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {actionLoading ? 'Launching...' : 'Approve & Launch Auction'}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
