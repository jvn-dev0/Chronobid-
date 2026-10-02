'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import s from './watchlist.module.css';

export default function WatchlistPage() {
  // Watchlist items state (empty by default for real user data)
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);

  return (
    <div className={s.pageContainer}>
      <div className={s.header}>
        <h1 className={s.title}>My Watchlist</h1>
        <p className={s.subtitle}>Keep track of the luxury auctions you're interested in.</p>
      </div>

      {watchlistItems.length === 0 ? (
        <div className={s.emptyContainer}>
          <div className={s.emptyIconWrapper}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Your Watchlist is Empty</h2>
          <p className={s.emptySubtitle}>
            You haven't added any luxury items to your watchlist yet. Click the heart icon on any active auction card to save items here and track live bid activity.
          </p>
          <Link href="/bidder/live" className={s.exploreBtn}>
            Explore Live Auctions
          </Link>
        </div>
      ) : (
        <div className={s.grid}>
          {watchlistItems.map(item => (
            <div key={item.id} className={s.card}>
              <div className={s.imageBox}>
                <img src={item.image} alt={item.title} className={s.imagePlaceholder} />
                <button className={s.heartBtn} title="Remove from Watchlist">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>
              <div className={s.cardContent}>
                <h3 className={s.itemName}>{item.title}</h3>
                <p className={s.sellerName}>by {item.seller}</p>
                
                <div className={s.priceRow}>
                  <div>
                    <span className={s.priceLabel}>Current Bid</span>
                    <div className={s.priceValue}>${item.current_bid?.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className={s.timeValue}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {item.time_left}
                    </span>
                  </div>
                </div>

                <Link href={`/bidder/auction/${item.id}`} className={s.bidBtn}>
                  Place Bid Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

