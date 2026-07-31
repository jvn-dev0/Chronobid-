'use client';

import React from 'react';
import s from './my-bids.module.css';

const mockBids = [
  {
    id: 1,
    title: 'Patek Philippe Nautilus',
    seller: 'Swiss Luxury Vault',
    my_bid: 12500,
    highest_bid: 12500,
    date: 'Jul 31, 2026',
    status: 'Won',
    image: 'https://images.unsplash.com/photo-1548171915-e7af55099cb3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 2,
    title: 'Rolex Submariner',
    seller: 'Timepiece Classics',
    my_bid: 4100,
    highest_bid: 4200,
    date: 'Aug 1, 2026',
    status: 'Outbid',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 3,
    title: 'Omega Speedmaster 1957',
    seller: 'Vintage Finds',
    my_bid: 8200,
    highest_bid: 8200,
    date: 'Aug 1, 2026',
    status: 'Winning',
    image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 4,
    title: 'Audemars Piguet Royal Oak',
    seller: 'Geneva Horology',
    my_bid: 28000,
    highest_bid: 35000,
    date: 'Jul 28, 2026',
    status: 'Lost',
    image: 'https://images.unsplash.com/photo-1587836374828-cb4387d59d42?auto=format&fit=crop&q=80&w=400'
  }
];

export default function MyBidsPage() {
  return (
    <div className={s.pageContainer}>
      <div className={s.header}>
        <h1 className={s.title}>My Bids</h1>
        <p className={s.subtitle}>Track all the bids you have placed across ChronoBid.</p>
      </div>

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
            {mockBids.map(bid => (
              <tr key={bid.id}>
                <td>
                  <div className={s.itemCol}>
                    <img src={bid.image} className={s.itemImg} alt="Watch" />
                    <div>
                      <div className={s.itemTitle}>{bid.title}</div>
                      <div className={s.itemSeller}>by {bid.seller}</div>
                    </div>
                  </div>
                </td>
                <td className={s.amount}>${bid.my_bid.toLocaleString()}</td>
                <td className={s.highestBid}>${bid.highest_bid.toLocaleString()}</td>
                <td className={s.date}>{bid.date}</td>
                <td>
                  <span className={`${s.badge} ${
                    bid.status === 'Winning' ? s.badgeWinning :
                    bid.status === 'Outbid' ? s.badgeOutbid :
                    bid.status === 'Won' ? s.badgeWon : s.badgeLost
                  }`}>
                    {bid.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
