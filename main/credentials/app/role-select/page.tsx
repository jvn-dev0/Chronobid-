'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import s from './role-select.module.css';

export default function RoleSelectPage() {
  const router = useRouter();

  const handleSelectRole = async (role: 'buyer' | 'seller') => {
    if (role === 'buyer') {
      router.push('/bidder/dashboard');
    } else {
      const token = typeof window !== 'undefined' ? localStorage.getItem('chronobid_token') : null;
      if (token) {
        try {
          const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.is_verified) {
            router.push('/seller/dashboard');
          } else {
            router.push('/seller/application');
          }
        } catch {
          router.push('/seller/application');
        }
      } else {
        router.push('/seller/application');
      }
    }
  };

  return (
    <div className={s.rolePageWrapper}>
      {/* ── Top Header Navigation Bar ── */}
      <header className={s.topNav}>
        <Link href="/" className={s.brandLogoGroup}>
          <div className={s.brandLogoIcon}>
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />
              <path d="M16 28L28 16M28 16L32 20M28 16L24 12M32 20L20 32M20 32L16 28M20 32L14 38" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="34" cy="14" r="3" fill="#ea580c" />
              <path d="M14 38L10 34" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div className={s.brandLogoTexts}>
            <div className={s.brandTitle}>
              <span className={s.brandChrono}>Chrono</span>
              <span className={s.brandBid}>Bid</span>
            </div>
            <span className={s.brandTagline}>Bid. Win. Own History.</span>
          </div>
        </Link>

        <div className={s.topRightTagline}>
          <span className={s.topTaglineLine} />
          <span className={s.topTaglineText}>The Intelligent Auction House</span>
        </div>
      </header>

      {/* ── Main Viewport Content: Hero & Role Selection Cards ── */}
      <main className={s.mainHeroSection}>
        
        {/* Category Tagline */}
        <div className={s.categoryTagWrapper}>
          <span className={s.categoryDash} />
          <span className={s.categoryTagText}>GLOBAL AUCTION PLATFORM</span>
        </div>

        {/* Hero Main Headline */}
        <h1 className={s.heroTitle}>
          Welcome to<br />
          <span className={s.heroTitleAccent}>ChronoBid!</span>
        </h1>

        {/* Subtitle Description */}
        <p className={s.heroSubtitle}>
          The premier auction house for vintage treasures and rare collectibles.
          Choose how you want to be part of our community.
        </p>

        {/* Micro Journey Note */}
        <div className={s.journeyNoteGroup}>
          <span className={s.journeyNoteBold}>Your journey. Your choice.</span>
          <span className={s.journeyNoteSub}>You can switch roles anytime from your account settings.</span>
        </div>

        {/* ── Two Large Side-by-Side Role Cards ── */}
        <div className={s.roleCardsGrid}>
          
          {/* Card 1: Bidder */}
          <div 
            className={`${s.roleCard} ${s.bidderCard}`}
            onClick={() => handleSelectRole('buyer')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectRole('buyer'); }}
          >
            <div>
              {/* Card Illustration Banner */}
              <div className={s.cardArtContainer}>
                <Image 
                  src="/role-bidder-art.png" 
                  alt="Bidder Gavel Artwork" 
                  width={255} 
                  height={105} 
                  className={s.cardArtImage}
                  priority
                />
              </div>

              <p className={s.cardRoleIntro}>I want to be a</p>
              <h2 className={s.cardRoleMainTitle}>Bidder</h2>
              <p className={s.cardRoleDescription}>
                Discover rare items, place bids, and win extraordinary pieces from around the world.
              </p>

              {/* Feature Checklist */}
              <ul className={s.cardChecklist}>
                <li className={s.cardChecklistItem}>
                  <div className={`${s.checklistIconCircle} ${s.iconCircleBidder}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m14 13-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z"/>
                      <path d="m16 11 3-3-2-2-3 3"/>
                      <path d="m18 9 2-2-2-2-2 2"/>
                    </svg>
                  </div>
                  <span>Bid on exclusive items</span>
                </li>
                
                <li className={s.cardChecklistItem}>
                  <div className={`${s.checklistIconCircle} ${s.iconCircleBidder}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                  </div>
                  <span>Secure escrow system</span>
                </li>

                <li className={s.cardChecklistItem}>
                  <div className={`${s.checklistIconCircle} ${s.iconCircleBidder}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <span>Real-time auction updates</span>
                </li>

                <li className={s.cardChecklistItem}>
                  <div className={`${s.checklistIconCircle} ${s.iconCircleBidder}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                  </div>
                  <span>Track your favorite items</span>
                </li>
              </ul>
            </div>

            <button type="button" className={`${s.cardActionBtn} ${s.btnBidder}`}>
              <span>Continue as Bidder</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>

          {/* Card 2: Seller */}
          <div 
            className={`${s.roleCard} ${s.sellerCard}`}
            onClick={() => handleSelectRole('seller')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectRole('seller'); }}
          >
            <div>
              {/* Card Illustration Banner */}
              <div className={s.cardArtContainer}>
                <Image 
                  src="/role-seller-art.png" 
                  alt="Seller Artifact Artwork" 
                  width={255} 
                  height={105} 
                  className={s.cardArtImage}
                  priority
                />
              </div>

              <p className={s.cardRoleIntro}>I want to</p>
              <h2 className={s.cardRoleMainTitle}>Sell</h2>
              <p className={s.cardRoleDescription}>
                List your valuable items, reach collectors, and grow with us.
              </p>

              {/* Feature Checklist */}
              <ul className={s.cardChecklist}>
                <li className={s.cardChecklistItem}>
                  <div className={`${s.checklistIconCircle} ${s.iconCircleSeller}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                  </div>
                  <span>List items for auction</span>
                </li>
                
                <li className={s.cardChecklistItem}>
                  <div className={`${s.checklistIconCircle} ${s.iconCircleSeller}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span>Reach genuine collectors</span>
                </li>

                <li className={s.cardChecklistItem}>
                  <div className={`${s.checklistIconCircle} ${s.iconCircleSeller}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                  </div>
                  <span>Safe & verified transactions</span>
                </li>

                <li className={s.cardChecklistItem}>
                  <div className={`${s.checklistIconCircle} ${s.iconCircleSeller}`}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                      <polyline points="16 7 22 7 22 13"/>
                    </svg>
                  </div>
                  <span>Grow your seller reputation</span>
                </li>
              </ul>
            </div>

            <button type="button" className={`${s.cardActionBtn} ${s.btnSeller}`}>
              <span>Continue as Seller</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>

        </div>

        {/* ── Bottom Guest Option Bar ── */}
        <div className={s.bottomGuestBar}>
          <span className={s.guestText}>Not ready to decide?</span>
          <button 
            type="button" 
            className={s.guestLinkBtn}
            onClick={() => router.push('/')}
          >
            <span>Explore Marketplace as Guest</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
        </div>

      </main>
    </div>
  );
}
