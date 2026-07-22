'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import s from '../auth.module.css';
import { getRole } from '../../lib/api';

export default function RoleSelectPage() {
  const router = useRouter();

  // In a real app, this would update the user's role in the DB
  const handleSelectRole = (role: 'buyer' | 'seller') => {
    // For now, just navigate to their respective dashboard
    if (role === 'buyer') {
      router.push('/bidder/dashboard');
    } else {
      router.push('/seller/application');
    }
  };

  return (
    <div className={s.authWrapper}>
      <div className={s.authCard}>

        {/* ── Left Panel ── */}
        <div className={s.leftPanel}>
          <div className={s.leftContent}>
            {/* Logo */}
            <div className={s.logo}>
              <span className={s.logoIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z"/><path d="m16 11 3-3-2-2-3 3"/><path d="m18 9 2-2-2-2-2 2"/></svg>
              </span>
              <div className={s.logoText}>
                <h1>ChronoBid</h1>
                <p>Bid. Win. Own History.</p>
              </div>
            </div>

            {/* Headline */}
            <div className={s.roleLeftHeadline}>
              <h2>Welcome to<br /><span>ChronoBid!</span></h2>
              <div className={s.roleLeftDivider}></div>
              <p>The premier auction house for vintage treasures and rare collectibles. Choose how you want to be part of our community.</p>
            </div>

            {/* Bottom Box */}
            <div className={s.roleLeftBox}>
              <div className={s.roleLeftBoxIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <div className={s.roleLeftBoxText}>
                <h4>Your journey. Your choice.</h4>
                <p>You can switch roles anytime from your account settings.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className={s.rightPanel} style={{ padding: '40px 64px' }}>
          
          <div className={s.formHeader}>
            <div className={s.roleHeaderIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z"/><path d="m16 11 3-3-2-2-3 3"/><path d="m18 9 2-2-2-2-2 2"/></svg>
            </div>
            <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>How would you like to<br/>get started?</h2>
            <p>Choose the option that best describes you.</p>
          </div>

          <div className={s.roleCards}>
            {/* Bidder Card */}
            <div className={`${s.roleCard} ${s.bidder}`} onClick={() => handleSelectRole('buyer')}>
              <div className={s.roleCardIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z"/><path d="m16 11 3-3-2-2-3 3"/><path d="m18 9 2-2-2-2-2 2"/></svg>
              </div>
              <h3>I want to be a<span>Bidder</span></h3>
              <p>Discover rare items, place bids, and win extraordinary pieces.</p>
              <ul className={s.roleChecklist}>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m14 13-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z"/></svg>Bid on exclusive items</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Secure escrow system</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Real-time auction updates</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>Track your favorite items</li>
              </ul>
              <button className={s.roleBtn}>
                Continue as Bidder <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* Seller Card */}
            <div className={`${s.roleCard} ${s.seller}`} onClick={() => handleSelectRole('seller')}>
              <div className={s.roleCardIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </div>
              <h3>I want to<span>Sell</span></h3>
              <p>List your valuable items, reach collectors, and grow with us.</p>
              <ul className={s.roleChecklist}>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>List items for auction</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Reach genuine collectors</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Safe & verified transactions</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Grow your seller reputation</li>
              </ul>
              <button className={s.roleBtn}>
                Continue as Seller <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          <div className={s.divider}>or</div>

          <div className={s.guestBar}>
            <div className={s.guestLeft}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Not sure right now? You can explore as a guest and choose later.</span>
            </div>
            <button className={s.guestBtn} onClick={() => router.push('/')}>
              Explore as Guest <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
