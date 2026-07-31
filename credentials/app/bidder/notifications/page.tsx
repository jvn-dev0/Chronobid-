'use client';

import React from 'react';
import s from './notifications.module.css';

const mockNotifications = [
  {
    id: 1,
    type: 'warning',
    title: 'You\'ve been outbid!',
    desc: 'Someone placed a higher bid ($4,200) on the Rolex Submariner. Place a new bid now to stay in the lead before time runs out!',
    time: '2 minutes ago',
    unread: true,
    action: 'Increase Bid'
  },
  {
    id: 2,
    type: 'success',
    title: 'Auction Won: Patek Philippe Nautilus',
    desc: 'Congratulations! You won the auction for $12,500. Please proceed to your wallet to release funds to the seller once received.',
    time: '2 hours ago',
    unread: true,
    action: 'Go to Wallet'
  },
  {
    id: 3,
    type: 'info',
    title: 'Upcoming Auction Reminder',
    desc: 'The Omega Speedmaster Professional from your watchlist is starting in 15 minutes. Get ready to bid!',
    time: '4 hours ago',
    unread: false,
    action: 'View Auction'
  },
  {
    id: 4,
    type: 'info',
    title: 'Account Verification Complete',
    desc: 'Your identity has been verified successfully by our AI pipeline. Your trust score has been updated.',
    time: '1 day ago',
    unread: false,
    action: null
  }
];

export default function NotificationsPage() {
  return (
    <div className={s.pageContainer}>
      <div className={s.header}>
        <h1 className={s.title}>Notifications</h1>
        <p className={s.subtitle}>Stay updated on your bids, wins, and account alerts.</p>
      </div>

      <div className={s.feed}>
        {mockNotifications.map(notif => (
          <div key={notif.id} className={`${s.notificationCard} ${notif.unread ? s.unread : ''}`}>
            
            <div className={`${s.iconWrapper} ${
              notif.type === 'warning' ? s.iconWarning : 
              notif.type === 'success' ? s.iconSuccess : s.iconInfo
            }`}>
              {notif.type === 'warning' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
              {notif.type === 'success' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
              {notif.type === 'info' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
            </div>

            <div className={s.content}>
              <h3 className={s.notifTitle}>{notif.title}</h3>
              <p className={s.notifDesc}>{notif.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={s.time}>{notif.time}</span>
                {notif.action && (
                  <button className={s.actionBtn}>{notif.action}</button>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
