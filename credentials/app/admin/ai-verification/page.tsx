'use client';
import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { Eye, ShieldAlert, CheckCircle2, ShieldX, Bot, ScanFace, Image as ImageIcon } from 'lucide-react';

export default function AIVerificationPage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('chronobid_token');
        const res = await fetch('http://localhost:8000/api/admin/pending-auctions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch (err) {
        console.error("Failed to fetch pending auctions", err);
      }
    };
    fetchReports();
  }, []);

  const handleApprove = async (auctionId: number) => {
    try {
      const token = localStorage.getItem('chronobid_token');
      const res = await fetch('http://localhost:8000/api/admin/approve-auction', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          auction_id: auctionId,
          action: 'Approve',
          comments: 'Approved via Dashboard'
        })
      });
      
      if (res.ok) {
        setReports(reports.filter(r => r.id !== auctionId));
        alert('Auction approved and is now Live!');
      } else {
        alert('Failed to approve auction');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>AI Verification Reports</h2>
          <p className={styles.pageSubtitle}>Review automated identity, object detection, and counterfeit analysis reports.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Total Scans (24h)</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <Bot size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>1,284</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Auto-Approved</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>89%</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Manual Reviews</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Eye size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>142</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Counterfeits Blocked</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>38</div>
        </div>
      </div>

      <div className={styles.tableContainer} style={{ padding: '24px' }}>
        <h3 className={styles.tableTitle} style={{ marginBottom: '20px' }}>Pending Auction Verifications</h3>
        
        {reports.length === 0 ? (
          <div style={{ color: '#8c9baf', padding: '40px 0', textAlign: 'center' }}>No pending verifications.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {reports.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ height: '200px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageIcon size={40} color="#475569" />
                  )}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#eab308', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                    Pending
                  </div>
                </div>
                <div style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>{item.title}</h4>
                  <div style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: 700, marginBottom: '16px' }}>${item.reserve_price?.toLocaleString()}</div>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handleApprove(item.id)}
                      style={{ flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <CheckCircle2 size={18} />
                      Proceed
                    </button>
                    <button style={{ backgroundColor: '#334155', color: '#f8fafc', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                      <ShieldX size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
