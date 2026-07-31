'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import s from './wallet.module.css';
import { getToken } from '../../../lib/api';

interface WalletData {
  balance: number;
  locked_balance: number;
}

interface Escrow {
  id: number;
  auction_id: int;
  locked_amount: number;
  status: string;
  auction_title: string;
  seller_name: string;
}

export default function BidderWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Wallet
      const wRes = await fetch('http://localhost:8000/api/wallet/balance', { headers });
      if (wRes.ok) {
        setWallet(await wRes.json());
      }

      // Fetch Escrows
      const eRes = await fetch('http://localhost:8000/api/escrow/bidder', { headers });
      if (eRes.ok) {
        setEscrows(await eRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (escrowId: number) => {
    if (!confirm("Are you sure you have received the item? This will release the funds to the seller and cannot be undone.")) {
      return;
    }
    
    setProcessingId(escrowId);
    setMessage('');
    
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:8000/api/escrow/release/${escrowId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to release funds');
      }
      
      setMessage('Funds successfully released to the seller!');
      await fetchData(); // Refresh data
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) return <div className={s.pageContainer}>Loading Wallet Data...</div>;

  const availableBalance = wallet ? wallet.balance - wallet.locked_balance : 0;

  return (
    <div className={s.pageContainer}>
      <div className={s.header}>
        <h1 className={s.title}>Wallet & Escrow</h1>
        <p className={s.subtitle}>Manage your funds and securely release payments for items you've won.</p>
      </div>

      {message && (
        <div style={{ padding: '1rem', background: '#dcfce7', color: '#16a34a', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          {message}
        </div>
      )}

      {/* Balance Cards */}
      <div className={s.balanceGrid}>
        <div className={s.balanceCard}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Total Balance</span>
            <svg className={s.cardIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <div className={s.balanceValue} style={{marginBottom: '1rem'}}>${wallet?.balance.toLocaleString() || '0'}</div>
          <Link href="/bidder/wallet/deposit" className={s.addFundsBtn}>
            + Add Funds
          </Link>
        </div>

        <div className={s.balanceCard}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Available to Bid</span>
            <svg className={s.cardIconAvailable} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className={s.balanceValue}>${availableBalance.toLocaleString()}</div>
        </div>

        <div className={s.balanceCard}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>Locked in Escrow</span>
            <svg className={s.cardIconLocked} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div className={s.balanceValue} style={{color: '#ca8a04'}}>${wallet?.locked_balance.toLocaleString() || '0'}</div>
        </div>
      </div>

      {/* Escrow Locks Table */}
      <div className={s.escrowSection}>
        <h2 className={s.sectionTitle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Active Escrow Holds
        </h2>
        
        {escrows.length === 0 ? (
          <div className={s.emptyState}>You have no pending escrow locks.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Seller</th>
                <th>Locked Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {escrows.map(e => (
                <tr key={e.id}>
                  <td style={{fontWeight: 600}}>{e.auction_title}</td>
                  <td>{e.seller_name}</td>
                  <td style={{fontWeight: 700}}>${e.locked_amount.toLocaleString()}</td>
                  <td>
                    <span className={`${s.statusBadge} ${e.status === 'Locked' ? s.statusLocked : s.statusReleased}`}>
                      {e.status}
                    </span>
                  </td>
                  <td>
                    {e.status === 'Locked' ? (
                      <button 
                        className={s.actionBtn} 
                        onClick={() => handleRelease(e.id)}
                        disabled={processingId === e.id}
                      >
                        {processingId === e.id ? 'Processing...' : 'Confirm Receipt & Release'}
                      </button>
                    ) : (
                      <span style={{color: '#9ca3af', fontSize: '0.85rem'}}>Released</span>
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
