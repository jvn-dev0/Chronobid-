'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import s from './my-bids.module.css';
import { getToken } from '../../../lib/api';

export default function MyBidsPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
    try {
      const token = getToken();
      if (!token) {
        setBids([]);
        setLoading(false);
        return;
      }

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/bids/my-bids', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBids(Array.isArray(data) ? data : []);
      } else {
        setBids([]);
      }
    } catch {
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      <div className={s.header}>
        <h1 className={s.title}>My Bids</h1>
        <p className={s.subtitle}>Track all the bids you have placed across ChronoBid.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
          Loading your bid history...
        </div>
      ) : bids.length === 0 ? (
        <div className={s.emptyContainer}>
          <div className={s.emptyIconWrapper}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <h2 className={s.emptyTitle}>No Bids Placed Yet</h2>
          <p className={s.emptySubtitle}>
            You haven't placed any bids on active auctions yet. Once you place a bid, your active bids, highest bids, and auction outcomes will be tracked here in real-time.
          </p>
          <Link href="/bidder/live" className={s.exploreBtn}>
            Explore Live Auctions
          </Link>
        </div>
      ) : (
        <div className={s.tableSection}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>My Bid</th>
                <th>Highest Bid</th>
                <th>Date Placed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bids.map(bid => (
                <tr key={bid.id || bid.auction_id}>
                  <td>
                    <div className={s.itemCol}>
                      <img src={bid.image_url || '/category-assets/watches.png'} className={s.itemImg} alt="Auction Lot" />
                      <div>
                        <div className={s.itemTitle}>{bid.title || bid.auction_title || 'Auction Lot'}</div>
                        <div className={s.itemSeller}>by {bid.seller_name || 'ChronoBid Verified Seller'}</div>
                      </div>
                    </div>
                  </td>
                  <td className={s.amount}>${(bid.bid_amount || bid.my_bid || 0).toLocaleString()}</td>
                  <td className={s.highestBid}>${(bid.highest_bid || bid.current_highest_bid || bid.bid_amount || 0).toLocaleString()}</td>
                  <td className={s.date}>{bid.date || 'Recent'}</td>
                  <td>
                    <span className={`${s.badge} ${
                      bid.status === 'Winning' || bid.is_highest ? s.badgeWinning :
                      bid.status === 'Outbid' ? s.badgeOutbid :
                      bid.status === 'Won' ? s.badgeWon : s.badgeLost
                    }`}>
                      {bid.status || (bid.is_highest ? 'Winning' : 'Outbid')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

