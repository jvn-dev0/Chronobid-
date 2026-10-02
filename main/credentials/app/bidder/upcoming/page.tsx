'use client';

import React from 'react';
import s from './upcoming.module.css';

const mockUpcoming = [
  {
    id: 1,
    title: 'A. Lange & Söhne Zeitwerk',
    seller: 'Prestige Time',
    reserve_price: 65000,
    start_time: '10:00 AM EST',
    month: 'AUG',
    day: '15',
    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 2,
    title: 'Vacheron Constantin Overseas',
    seller: 'Geneva Horology',
    reserve_price: 32000,
    start_time: '12:30 PM EST',
    month: 'AUG',
    day: '18',
    image: 'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 3,
    title: 'Rolex GMT-Master II "Pepsi"',
    seller: 'Watch Collector Co.',
    reserve_price: 18500,
    start_time: '09:00 AM EST',
    month: 'SEP',
    day: '02',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=400'
  }
];

export default function UpcomingAuctionsPage() {
  return (
    <div className={s.pageContainer}>
      <div className={s.header}>
        <h1 className={s.title}>Upcoming Auctions</h1>
        <p className={s.subtitle}>Preview highly anticipated items before they go live. Add them to your calendar so you don't miss out.</p>
      </div>

      <div className={s.upcomingList}>
        {mockUpcoming.map(item => (
          <div key={item.id} className={s.auctionRow}>
            <div className={s.imageBox}>
              <img src={item.image} alt={item.title} className={s.image} />
              <div className={s.dateBadge}>
                <div className={s.dateMonth}>{item.month}</div>
                <div className={s.dateDay}>{item.day}</div>
              </div>
            </div>
            
            <div className={s.content}>
              <h3 className={s.itemName}>{item.title}</h3>
              <p className={s.sellerName}>by {item.seller}</p>
              
              <div className={s.detailsGrid}>
                <div>
                  <div className={s.detailLabel}>Reserve Price</div>
                  <div className={s.detailValue}>${item.reserve_price.toLocaleString()}</div>
                </div>
                <div>
                  <div className={s.detailLabel}>Start Time</div>
                  <div className={s.detailValue}>{item.start_time}</div>
                </div>
              </div>

              <div className={s.actions}>
                <button className={s.btnPrimary}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '0.5rem', verticalAlign: 'middle'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Add to Calendar
                </button>
                <button className={s.btnSecondary}>Add to Watchlist</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
