'use client';

import React, { useState, useEffect } from 'react';
import s from './escrow.module.css';
import { getToken } from '../../../lib/api';

interface Escrow {
  id: number;
  auction_id: number;
  locked_amount: number;
  status: string;
  auction_title: string;
  buyer_name: string;
}

export default function SellerEscrowDashboard() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Escrows for this seller
      const res = await fetch('http://localhost:8000/api/escrow/seller', { headers });
      if (res.ok) {
        setEscrows(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={s.pageContainer}>Loading Escrow Data...</div>;

  return (
    <div className={s.pageContainer}>
      <div className={s.header}>
        <h1 className={s.title}>Escrow Tracking</h1>
        <p className={s.subtitle}>Track incoming funds from your won auctions. Funds will automatically release to your wallet once the buyer confirms receipt.</p>
      </div>

      <div className={s.escrowSection}>
        <h2 className={s.sectionTitle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Incoming Payouts
        </h2>
        
        {escrows.length === 0 ? (
          <div className={s.emptyState}>No funds are currently held in escrow.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Auction Item</th>
                <th>Buyer</th>
                <th>Payout Amount</th>
                <th>Status</th>
                <th>Action Required</th>
              </tr>
            </thead>
            <tbody>
              {escrows.map(e => (
                <tr key={e.id}>
                  <td style={{fontWeight: 600}}>{e.auction_title}</td>
                  <td>{e.buyer_name}</td>
                  <td style={{fontWeight: 700}}>${e.locked_amount.toLocaleString()}</td>
                  <td>
                    <span className={`${s.statusBadge} ${e.status === 'Locked' ? s.statusLocked : s.statusReleased}`}>
                      {e.status === 'Locked' ? 'Pending Buyer Receipt' : 'Funds Released'}
                    </span>
                  </td>
                  <td>
                    {e.status === 'Locked' ? (
                      <span style={{color: '#6b7280', fontSize: '0.85rem'}}>Ship item to unlock funds</span>
                    ) : (
                      <span style={{color: '#16a34a', fontSize: '0.85rem', fontWeight: 600}}>Transferred to Wallet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
