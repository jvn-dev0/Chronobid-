'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import s from './dashboard.module.css';
import AuctionCard from '../../../components/AuctionCard';
import { getToken } from '../../../lib/api';

interface Auction {
  id: number;
  title: string;
  description?: string;
  reserve_price: number;
  current_highest_bid?: number;
  end_time: string;
  image_url?: string;
  status: string;
}

export default function BidderDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<{first_name?: string, last_name?: string, id?: number}>({});
  const [wallet, setWallet] = useState<{balance: number, locked_balance: number}>({balance: 0, locked_balance: 0});
  const [jasperInput, setJasperInput] = useState('');
  const [jasperReply, setJasperReply] = useState('');
  const [isJasperLoading, setIsJasperLoading] = useState(false);

  const askJasper = async () => {
    if (!jasperInput.trim()) return;
    setIsJasperLoading(true);
    setJasperReply('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: jasperInput, user_role: 'bidder', user_id: profile.id || 1 })
      });
      const data = await res.json();
      setJasperReply(data.answer);
      setJasperInput('');
    } catch (e) {
      setJasperReply("Sorry, Jasper is offline.");
    }
    setIsJasperLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch User
      fetch('http://localhost:8000/api/auth/me', { headers })
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(() => {});

      // Fetch Wallet
      fetch('http://localhost:8000/api/wallet/balance', { headers })
        .then(res => res.json())
        .then(data => setWallet(data))
        .catch(() => {});

      // Fetch Auctions
      const res = await fetch('http://localhost:8000/api/auctions/live', { headers });
      if (!res.ok) throw new Error('Failed to fetch auctions');
      const data = await res.json();
      setAuctions(data.slice(0, 4)); // Only show top 4 for the row
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching auctions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.mainGrid}>
      {/* Left Column (Main Content) */}
      <div className={s.leftColumn}>
        
        {/* Hero Banner */}
        <div className={s.heroBanner}>
          <div className={s.heroContent}>
            <div className={s.heroWelcome}>Welcome back,</div>
            <h1 className={s.heroName}>
              {profile.first_name || 'Jeevan'} {profile.last_name || 'Babu K B'} 
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ca8a04" stroke="#ca8a04" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </h1>
            <p className={s.heroSub}>Discover rare vintage items, authenticated art, and win timeless heritage for your collection.</p>
            <Link href="/bidder/live"><button className={s.heroBtn}>Browse Live Auctions</button></Link>
          </div>
          <div className={s.heroImage}></div>
        </div>

        {/* 4 Stats Cards */}
        <div className={s.statsRow}>
          <div className={s.statCard}>
            <div className={s.statIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
            </div>
            <div className={s.statInfo}>
              <span className={s.statLabel}>Active Bids</span>
              <span className={s.statValue}>0</span>
              <Link href="/bidder/my-bids" className={s.statLink}>View My Bids &rarr;</Link>
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div className={s.statInfo}>
              <span className={s.statLabel}>Watching</span>
              <span className={s.statValue}>0</span>
              <Link href="/bidder/watchlist" className={s.statLink}>View Watchlist &rarr;</Link>
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <div className={s.statInfo}>
              <span className={s.statLabel}>Won Auctions</span>
              <span className={s.statValue}>0</span>
              <Link href="/bidder/won" className={s.statLink}>View Won &rarr;</Link>
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div className={s.statInfo}>
              <span className={s.statLabel}>Wallet Balance</span>
              <span className={s.statValue}>${wallet.balance.toLocaleString()}</span>
              <Link href="/bidder/wallet" className={s.statLink}>Add Funds &rarr;</Link>
            </div>
          </div>
        </div>

        {/* Live Auctions */}
        <div>
          <div className={s.sectionHeader}>
            <div className={s.sectionTitle}>Live Auctions <span className={s.liveTag}>{auctions.length} Live Now</span></div>
            <Link href="/bidder/live" className={s.viewAll}>View All &rarr;</Link>
          </div>
          
          {error && <div style={{color: '#ef4444', marginBottom: '1rem'}}>{error}</div>}
          {loading ? (
            <div style={{color: '#6b7280', padding: '2rem'}}>Loading active auctions...</div>
          ) : (
            <div className={s.auctionsRow}>
              {auctions.map(auction => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Split */}
        <div className={s.bottomSplit}>
          {/* Watchlist Table */}
          <div className={s.widgetCard}>
            <div className={s.sectionHeader}>
              <div className={s.sectionTitle}>My Watchlist</div>
              <Link href="/bidder/watchlist" className={s.viewAll}>View All &rarr;</Link>
            </div>
            
            <table className={s.watchTable}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Current Bid</th>
                  <th>Ends In</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#8c9baf' }}>
                    No items in your watchlist yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Recent Activity */}
          <div className={s.widgetCard}>
            <div className={s.sectionHeader}>
              <div className={s.sectionTitle}>Recent Activity</div>
              <Link href="/bidder/activity" className={s.viewAll}>View All &rarr;</Link>
            </div>
            
            <div className={s.activityList} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: '#8c9baf' }}>
              No recent activity to show.
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (Widgets) */}
      <div className={s.rightColumn}>
        
        {/* Wallet Widget */}
        <div className={s.widgetCard}>
          <div className={s.sectionHeader}>
            <div className={s.sectionTitle}>My Wallet & Escrow</div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8c9baf" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <div style={{ color: '#8c9baf', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Available Balance</div>
          <div className={s.walletBalance}>${wallet.balance.toLocaleString()}</div>
          <button className={s.btnPrimary}>Add Funds</button>
          <Link href="/bidder/wallet" className={s.viewAll} style={{textAlign: 'center'}}>View Transaction History &rarr;</Link>
        </div>

        {/* AI Assistant Widget */}
        <div className={s.aiWidget}>
          <div className={s.aiHeader}>
            <div className={s.aiRobot}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
            </div>
            <div>
              <div className={s.aiName}>AI Assistant Jasper <span style={{color: '#eab308'}}>✨</span></div>
              <div className={s.aiStatus}>Online</div>
            </div>
          </div>
          <div className={s.aiMessage} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
            {jasperReply || `Hi ${profile.first_name || 'there'}! I can help you find rare items, track auctions, or give bidding advice.`}
            {isJasperLoading && <div style={{marginTop: 5, color: '#eab308'}}>Thinking...</div>}
          </div>
          <div className={s.aiInput}>
            <input 
              type="text" 
              placeholder="Ask Jasper anything..." 
              value={jasperInput}
              onChange={(e) => setJasperInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askJasper()}
            />
            <button className={s.aiSend} onClick={askJasper}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>

        {/* Recommended For You */}
        <div className={s.widgetCard}>
          <div className={s.sectionHeader}>
            <div className={s.sectionTitle}>Recommended</div>
            <Link href="/bidder/recommended" className={s.viewAll}>View All &rarr;</Link>
          </div>
          <div className={s.recommendedGrid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', color: '#8c9baf' }}>
            No recommendations available yet.
          </div>
        </div>

      </div>
    </div>
  );
}
