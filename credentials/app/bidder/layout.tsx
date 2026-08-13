'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import s from './bidder.module.css';
import Logo from '../../components/Logo';
import { clearSession, getToken } from '../../lib/api';

export default function BidderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<{first_name?: string, last_name?: string, username?: string}>({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    } else {
      // Fetch user profile for the top right
      fetch('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error("Error fetching profile:", err));
    }
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/bidder/dashboard', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
    { name: 'Live Auctions', path: '/bidder/live', icon: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></> },
    { name: 'My Bids', path: '/bidder/my-bids', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></> },
    { name: 'Watchlist', path: '/bidder/watchlist', badge: '0', icon: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></> },
    { name: 'Won Auctions', path: '/bidder/won', icon: <><path d="M12 15l-2 5l9-9l-9-9l2 5l-9 9z"/></> },
    { name: 'Wallet & Escrow', path: '/bidder/wallet', icon: <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></> },
    { name: 'Notifications', path: '/bidder/notifications', badge: '0', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
    { name: 'Profile Settings', path: '/seller/profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> }
  ];

  return (
    <div className={s.layoutContainer}>
      
      {/* Left Sidebar */}
      <aside className={s.sidebar}>
        <div className={s.logoContainer}>
          <Logo size={28} fontSize={22} />
        </div>
        
        <nav className={s.navSection}>
          {navItems.map(item => (
            <Link 
              key={item.name} 
              href={item.path} 
              className={`${s.navItem} ${pathname === item.path ? s.active : ''}`}
            >
              <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {item.icon}
              </svg>
              {item.name}
              {item.badge && <span className={s.badge}>{item.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className={s.inviteBox}>
          <h4>Invite & Earn</h4>
          <p>Invite your friends and earn exciting rewards.</p>
          <button className={s.inviteBtn}>Invite Now</button>
        </div>
      </aside>

      {/* Main Content Area (offset by sidebar) */}
      <div className={s.mainWrapper}>
        
        {/* Top Header */}
        <header className={s.topHeader}>
          <div className={s.searchBar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8c9baf" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search items, categories, auctions..." />
          </div>

          <div className={s.headerActions}>
            <button className={s.browseBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Browse Categories
            </button>
            
            <button className={s.iconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            
            <button className={s.iconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className={s.notificationDot}></span>
            </button>

            <div style={{ position: 'relative' }}>
              <div className={s.profileSection} onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <div className={s.profileInfo}>
                  <span className={s.profileName}>@{profile?.username || 'user'}</span>
                  <span className={s.profileRole}>Buyer</span>
                </div>
                <div className={s.avatar}>
                  {profile.first_name ? profile.first_name[0].toUpperCase() : 'B'}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8c9baf" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>

              {isProfileOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '1rem', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '0.5rem', minWidth: '150px', zIndex: 200, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  <Link href="/seller/profile" style={{ display: 'block', padding: '0.75rem', color: '#c9d1d9', textDecoration: 'none', borderRadius: '4px' }}>Profile Settings</Link>
                  <div style={{ borderTop: '1px solid #30363d', margin: '0.25rem 0' }}></div>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem', color: '#f85149', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: '500' }}>Log Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className={s.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
