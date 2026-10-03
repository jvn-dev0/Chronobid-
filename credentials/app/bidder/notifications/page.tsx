'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import s from './notifications.module.css';
import { getToken } from '../../../lib/api';

interface NotificationItem {
  id: number;
  type: 'warning' | 'success' | 'info';
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  action?: string | null;
  link?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Fetch Backend Notifications
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/notifications', { headers });
      let list: NotificationItem[] = [];
      if (res.ok) {
        list = await res.json();
      }

      // 2. Fetch Jasper AI Recommendations Notification
      try {
        const aiRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: "What items should I bid on today?", user_role: 'bidder', user_id: 1 })
        });
        const aiData = await aiRes.json();

        if (aiData.recommendations && aiData.recommendations.length > 0) {
          const topVault = aiData.recommendations.find((r: any) => r.source === 'vault');
          const topTrending = aiData.recommendations.find((r: any) => r.source === 'trending');

          const vaultText = topVault ? `${topVault.title} (${topVault.category})` : 'your favorite categories';
          const trendText = topTrending ? `${topTrending.category}` : 'popular market items';

          const jasperNotif: NotificationItem = {
            id: 999999,
            type: 'info',
            title: "✨ Jasper AI: New Recommendations Ready",
            desc: `Jasper has curated 4 personalized lots for you! Recommended Vault lot: '${vaultText}'. Trending category: '${trendText}'.`,
            time: 'Just now',
            unread: true,
            action: 'View Recommendations',
            link: '/bidder/dashboard'
          };

          // Insert Jasper recommendation notification at top of feed
          list = [jasperNotif, ...list];
        }
      } catch (err) {
        console.warn("Jasper AI notification fetch fallback:", err);
      }

      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };


  const handleSimulateOutbid = () => {
    const testOutbid: NotificationItem = {
      id: Date.now(),
      type: 'warning',
      title: "You've been outbid!",
      desc: 'Another bidder placed a higher bid ($4,200) on Vintage Rolex Submariner. Place a new bid now to stay in the lead!',
      time: 'Just now',
      unread: true,
      action: 'Increase Bid',
      link: '/bidder/live'
    };
    setNotifications(prev => [testOutbid, ...prev]);
  };

  if (loading) {
    return (
      <div className={s.pageContainer} style={{ textAlign: 'center', paddingTop: '60px', color: '#6B7280' }}>
        Checking notifications...
      </div>
    );
  }

  return (
    <div className={s.pageContainer}>
      <div className={s.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={s.title}>Notifications</h1>
          <p className={s.subtitle}>Stay updated on your bids, outbid alerts, and auction wins.</p>
        </div>

        {/* Test simulation control */}
        <button
          onClick={handleSimulateOutbid}
          style={{ background: 'none', border: '1px border #D1D5DB', color: '#6B7280', fontSize: '12px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', opacity: 0.6 }}
          title="Simulate how an outbid alert will look when another bidder outbids you"
        >
          ⚡ Simulate Outbid Alert
        </button>
      </div>

      <div className={s.feed}>
        {notifications.length === 0 ? (
          <div className={s.emptyCard}>
            <div className={s.emptyIconWrap}>
              🔔
            </div>
            <h2 className={s.emptyTitle}>No Notifications Yet</h2>
            <p className={s.emptySub}>
              You have no outbid alerts right now. You are currently in the lead on all your active bids, or haven't been outbid yet.
            </p>
            <Link href="/bidder/live" className={s.primaryBtn}>
              Explore Live Auctions →
            </Link>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`${s.notificationCard} ${notif.unread ? s.unread : ''}`}>
              <div className={`${s.iconWrapper} ${
                notif.type === 'warning' ? s.iconWarning : 
                notif.type === 'success' ? s.iconSuccess : s.iconInfo
              }`}>
                {notif.type === 'warning' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                )}
                {notif.type === 'success' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                )}
                {notif.type === 'info' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                )}
              </div>

              <div className={s.content}>
                <h3 className={s.notifTitle}>{notif.title}</h3>
                <p className={s.notifDesc}>{notif.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={s.time}>{notif.time}</span>
                  {notif.action && (
                    <Link href={notif.link || "/bidder/live"}>
                      <button className={s.actionBtn}>{notif.action}</button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
