'use client';

import React from 'react';
import s from './watchlist.module.css';

const mockWatchlist = [
  {
    id: 1,
    title: 'Rolex Daytona Platinum',
    seller: 'Swiss Luxury Vault',
    current_bid: 75000,
    time_left: '02:14:30',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 2,
    title: 'Audemars Piguet Royal Oak',
    seller: 'Timepiece Classics',
    current_bid: 42000,
    time_left: '08:45:12',
    image: 'https://images.unsplash.com/photo-1548171915-e7af55099cb3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 3,
    title: 'Patek Philippe Calatrava',
    seller: 'Geneva Horology',
    current_bid: 28500,
    time_left: '14:20:00',
    image: 'https://images.unsplash.com/photo-1587836374828-cb4387d59d42?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 4,
    title: 'Omega Speedmaster 1957',
    seller: 'Vintage Finds',
    current_bid: 8200,
    time_left: '1d 04h',
    image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=400'
  }
];

export default function WatchlistPage() {
  return (
    <div className={s.pageContainer}>
      <div className={s.header}>
        <h1 className={s.title}>My Watchlist</h1>
        <p className={s.subtitle}>Keep track of the auctions you're interested in.</p>
      </div>

      <div className={s.grid}>
        {mockWatchlist.map(item => (
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
                  <div className={s.priceValue}>${item.current_bid.toLocaleString()}</div>
                </div>
                <div>
                  <span className={s.timeValue}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {item.time_left}
                  </span>
                </div>
              </div>

              <button className={s.bidBtn}>Place Bid Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
